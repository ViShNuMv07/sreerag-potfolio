import React from 'react';
import { Maximize2 } from 'lucide-react';

export default function ProjectMockup({ project, onOpenGallery }) {
  const images = project.images || [];
  const visible = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - 4);
  const isThree = visible.length === 3;

  return (
    <div className="mockup-frame">
      <div className="mockup-topbar">
        <div className="mockup-dots"><i /><i /><i /></div>
        <span>{project.titleLead} {project.titleAccent}</span>
        <span className="mockup-live">{images.length} WORKS</span>
      </div>

      <div className={`mockup-body poster-grid ${isThree ? 'is-three' : ''}`}>
        {visible.map((item, idx) => {
          const isLastWithMore = idx === 3 && extraCount > 0;
          return (
            <button
              type="button"
              key={item.src}
              className={`poster-tile ${isThree && idx === 0 ? 'is-lead' : ''}`}
              onClick={() => onOpenGallery?.(project, idx)}
              aria-label={`View ${item.label}`}
            >
              <img src={item.src} alt={item.label} loading="lazy" />
              <div className="poster-overlay">
                <span>{item.label}</span>
                <Maximize2 size={13} />
              </div>
              {isLastWithMore && (
                <div className="poster-more">
                  <strong>+{extraCount}</strong>
                  <span>VIEW ALL</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
