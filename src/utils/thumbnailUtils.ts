// Utility for generating thumbnail data URIs from canvas strokes
// Used for gallery previews without needing ViewShot ref

export function generateThumbnailDataURI(
  layers: Array<{ strokes: Array<{ points: Array<{ x: number; y: number }>; color: string; brushSize: number }> }>,
  canvasWidth: number,
  canvasHeight: number,
  scale: number = 0.3
): string {
  try {
    // Create a small canvas for thumbnail
    const thumbWidth = Math.round(canvasWidth * scale);
    const thumbHeight = Math.round(canvasHeight * scale);
    
    // Use canvas element if available (web)
    if (typeof document !== 'undefined' && document.createElement) {
      const canvas = document.createElement('canvas');
      canvas.width = thumbWidth;
      canvas.height = thumbHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';
      
      // Fill background
      ctx.fillStyle = '#1C1C1E';
      ctx.fillRect(0, 0, thumbWidth, thumbHeight);
      
      // Draw all strokes
      layers.forEach(layer => {
        layer.strokes.forEach(stroke => {
          if (stroke.points.length < 2) return;
          
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = (stroke.brushSize || 1) * scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          const firstPoint = stroke.points[0];
          ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale);
          
          for (let i = 1; i < stroke.points.length; i++) {
            const point = stroke.points[i];
            ctx.lineTo(point.x * scale, point.y * scale);
          }
          ctx.stroke();
        });
      });
      
      return canvas.toDataURL('image/jpeg', 0.6);
    }
    
    return '';
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return '';
  }
}
