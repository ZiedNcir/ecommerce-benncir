import Order from '../models/Order.ts';
import Product from '../models/Product.ts';
import Category from '../models/Category.ts';
import User from '../models/User.ts';
import { sendAdminOrderEmail } from '../utils/mailer.ts';
import { escapeRegex } from '../utils/security.ts';
import { requireEmail, requirePositiveInteger, requireText } from '../utils/validation.ts';
import { calculateOrderTotals, canRestoreStock } from '../utils/orderRules.ts';

async function hydrateItems(items = []) {
  if (!Array.isArray(items) || !items.length) throw Object.assign(new Error('La commande doit contenir au moins un produit'), { statusCode: 400 });
  const ids = [...new Set(items.map((i) => String(i.product || '')).filter(Boolean))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate('categories', 'name slug parent');
  const map = new Map(products.map((p) => [String(p._id), p]));
  return items.map((item) => {
    const product = map.get(String(item.product));
    if (!product) throw Object.assign(new Error('Un produit de la commande est introuvable ou inactif'), { statusCode: 400 });
    const quantity = requirePositiveInteger(item.quantity, 'Quantité');
    if (quantity > Number(product.stock || 0)) throw Object.assign(new Error(`Stock insuffisant pour ${product.name}`), { statusCode: 409 });
    return { product: product._id, name: product.name, price: product.price, quantity, image: product.images?.[0] || '', categories: (product.categories as any[]).map((c) => ({ _id: c._id, name: c.name, slug: c.slug })) };
  });
}

async function updateStock(items, direction) {
  const completed = [];
  try {
    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const query = direction < 0
        ? { _id: item.product, stock: { $gte: quantity } }
        : { _id: item.product };
      const product = await Product.findOneAndUpdate(
        query,
        { $inc: { stock: direction * quantity } },
        { new: true },
      );
      if (!product) throw Object.assign(new Error(`Stock insuffisant pour ${item.name}`), { statusCode: 409 });
      completed.push(item);
    }
  } catch (error) {
    for (const item of completed) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -direction * Number(item.quantity || 0) } });
    }
    throw error;
  }
}

export async function createOrder(req, res) {
  const { customer, items: requestedItems, note = '' } = req.body || {};
  if (!customer || !requestedItems?.length) return res.status(400).json({ message: 'Client et produits obligatoires' });
  const requiredCustomerFields = ['fullName', 'email', 'phone', 'address', 'city'];
  const missingFields = requiredCustomerFields.filter((field) => !String(customer[field] || '').trim());
  if (missingFields.length) return res.status(400).json({ message: `Informations client manquantes : ${missingFields.join(', ')}` });

  const items = await hydrateItems(requestedItems);
  const { subtotal, total } = calculateOrderTotals(items, 7);
  await updateStock(items, -1);
  let order;
  try {
    order = await Order.create({
      customer: {
        fullName: requireText(customer.fullName, 'Nom', { max: 120 }),
        email: requireEmail(customer.email),
        phone: requireText(customer.phone, 'Téléphone', { max: 40 }),
        address: requireText(customer.address, 'Adresse', { max: 300 }),
        city: requireText(customer.city, 'Ville', { max: 120 }),
        governorate: String(customer.governorate || '').trim().slice(0, 120),
        postalCode: String(customer.postalCode || '').trim().slice(0, 20),
        country: 'Tunisie',
      },
      items,
      subtotal,
      total,
      paymentMethod: 'cash_on_delivery',
      note: String(note || '').trim().slice(0, 1000),
      user: req.user?._id,
      statusHistory: [{ status: 'pending', changedAt: new Date(), changedBy: req.user?._id || null }],
    });
  } catch (error) {
    await updateStock(items, 1);
    throw error;
  }

  try {
    const result = await sendAdminOrderEmail(order);
    if (result.sent) {
      order.adminEmailSent = true;
      await order.save({ validateBeforeSave: false });
    }
  } catch (error) {
    order.adminEmailError = error.message;
    await order.save({ validateBeforeSave: false });
  }
  res.status(201).json(order);
}

export async function getOrders(req, res) {
  const { status, search, page = 1, limit = 30 } = req.query; const filter: any = {};
  if (status && status !== 'all') filter.status = status;
  if (search) { const v = escapeRegex(String(search).trim()); filter.$or = [{ orderNumber: { $regex:v,$options:'i' } },{ 'customer.fullName': { $regex:v,$options:'i' } },{ 'customer.email': { $regex:v,$options:'i' } },{ 'customer.phone': { $regex:v,$options:'i' } }]; }
  const currentPage=Math.max(Number(page),1), perPage=Math.min(Math.max(Number(limit),1),100);
  const [items,total]=await Promise.all([Order.find(filter).populate('user','name email').sort({createdAt:-1}).skip((currentPage-1)*perPage).limit(perPage),Order.countDocuments(filter)]);
  res.json({items,total,page:currentPage,pages:Math.ceil(total/perPage)||1});
}

export async function getOrderById(req,res){
  const order=await Order.findById(req.params.id).populate('user','name email').populate('statusHistory.changedBy','name email').populate({path:'items.product',select:'name slug sku brand images categories',populate:{path:'categories',select:'name slug parent',populate:{path:'parent',select:'name slug'}}});
  if(!order) return res.status(404).json({message:'Commande introuvable'}); res.json(order);
}
export async function getMyOrders(req,res){res.json(await Order.find({user:req.user._id}).sort({createdAt:-1}));}
export async function updateOrderStatus(req,res){
  const allowed=['pending','confirmed','preparing','shipped','delivered','cancelled'];
  const nextStatus=req.body.status;
  if(!allowed.includes(nextStatus))return res.status(400).json({message:'Statut invalide'});
  const order=await Order.findById(req.params.id);
  if(!order)return res.status(404).json({message:'Commande introuvable'});
  if(order.status==='cancelled'&&nextStatus!=='cancelled')return res.status(409).json({message:'Une commande annulée ne peut pas être réactivée'});
  if(nextStatus==='cancelled'&&canRestoreStock(order)){
    await updateStock(order.items,1);
    order.stockRestored=true;
  }
  if(order.status!==nextStatus){
    order.status=nextStatus;
    order.statusHistory.push({status:nextStatus,changedAt:new Date(),changedBy:req.user?._id||null,note:String(req.body.note||'').trim().slice(0,500)});
  }
  await order.save();
  res.json(order);
}
export async function deleteOrder(req,res){
  const order=await Order.findById(req.params.id);
  if(!order)return res.status(404).json({message:'Commande introuvable'});
  if(canRestoreStock(order)) await updateStock(order.items,1);
  await order.deleteOne();
  res.json({message:'Commande supprimée et stock rétabli',orderId:req.params.id});
}

export async function getDashboardAnalytics(req,res){
  const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1),prev=new Date(now.getFullYear(),now.getMonth()-1,1);
  const [totals,statusStats,recentOrders,dailyRevenue,products,categories,subcategories,users,topCategories]=await Promise.all([
    Order.aggregate([{ $group:{_id:null,orders:{$sum:1},revenue:{$sum:'$total'},averageOrder:{$avg:'$total'}}}]),
    Order.aggregate([{ $group:{_id:'$status',count:{$sum:1},revenue:{$sum:'$total'}}}]),
    Order.find().sort({createdAt:-1}).limit(8),
    Order.aggregate([{ $match:{createdAt:{$gte:new Date(Date.now()-14*86400000)}}},{ $group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$createdAt'}},revenue:{$sum:'$total'},orders:{$sum:1}}},{ $sort:{_id:1}}]),
    Product.countDocuments({isActive:true}),Category.countDocuments({parent:null,isActive:true}),Category.countDocuments({parent:{$ne:null},isActive:true}),User.countDocuments(),
    Product.aggregate([{ $match:{isActive:true}},{ $unwind:'$categories'},{ $group:{_id:'$categories',products:{$sum:1}}},{ $sort:{products:-1}},{ $limit:6},{ $lookup:{from:'categories',localField:'_id',foreignField:'_id',as:'category'}},{ $unwind:'$category'},{ $project:{name:'$category.name',products:1}}])
  ]);
  const current=await Order.aggregate([{ $match:{createdAt:{$gte:monthStart}}},{ $group:{_id:null,orders:{$sum:1},revenue:{$sum:'$total'}}}]);
  const previous=await Order.aggregate([{ $match:{createdAt:{$gte:prev,$lt:monthStart}}},{ $group:{_id:null,revenue:{$sum:'$total'}}}]);
  const growth=previous[0]?.revenue?((current[0]?.revenue||0)-previous[0].revenue)/previous[0].revenue*100:0;
  res.json({totals:totals[0]||{orders:0,revenue:0,averageOrder:0},currentMonth:current[0]||{orders:0,revenue:0},growth,statusStats,recentOrders,dailyRevenue,catalog:{products,categories,subcategories,users},topCategories});
}
