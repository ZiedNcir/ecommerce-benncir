import { useState } from 'react';

type ImageWithSkeletonProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
};

export default function ImageWithSkeleton({ wrapperClassName = '', className = '', alt = '', onLoad, onError, ...props }: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  function handleLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    setLoaded(true);
    onLoad?.(event);
  }

  function handleError(event: React.SyntheticEvent<HTMLImageElement>) {
    setFailed(true);
    setLoaded(true);
    onError?.(event);
  }

  return (
    <span className={`image-skeleton-wrap ${wrapperClassName} ${loaded ? 'is-loaded' : ''} ${failed ? 'is-failed' : ''}`} aria-busy={!loaded}>
      {!loaded ? <span className="image-skeleton" aria-hidden="true" /> : null}
      {failed ? <span className="image-fallback" aria-hidden="true">Image indisponible</span> : <img {...props} className={`image-with-skeleton ${className}`} alt={alt} onLoad={handleLoad} onError={handleError} />}
    </span>
  );
}
