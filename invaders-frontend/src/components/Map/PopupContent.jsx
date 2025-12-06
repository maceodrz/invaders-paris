import { useState } from 'react';
import { updateInvaderComment } from '../../services/api';

function PopupContent({ invader, onStatusUpdate, onCommentUpdate }) {
  const { id, address, flashed, flashable, hint, image_url, comment: initialComment, instagram_url } = invader;
  const [comment, setComment] = useState(initialComment || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialComment); // Start editing if no initial comment
  const hasComment = comment || initialComment;

  const handleSaveComment = async () => {
    setIsSaving(true);
    try {
      const response = await updateInvaderComment(id, comment);
      if (response.status === 'success') {
        onCommentUpdate(response.invader);
        setIsEditing(false); // Exit edit mode after successful save
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (err) {
      console.error('Failed to save comment:', err);
      alert('Failed to save comment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentClick = (event) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div style={{ lineHeight: '1.2', wordWrap: 'break-word' }}>
      <h3 className="popup-h3">son p'tit nom : {id}</h3>
      
      {flashed && image_url && (
        <div className="invader-image-container" style={{ margin: '5px 0' }}>
            <img 
                src={image_url} 
                alt={`Invader ${id}`} 
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
            />
        </div>
      )}

      <p className="popup-paragraph"><strong>Statut :</strong> {flashed ? 'Flashé' : 'Non flashé'}</p>
      <p className="popup-paragraph">
        <strong>
          <a href={instagram_url} target="_blank" rel="noopener noreferrer">Voir sur instagram</a>
        </strong>
      </p>
      <p className="popup-paragraph"><strong>Adresse :</strong> {address}</p>
      {hint && <p className="popup-paragraph"><strong>Indice :</strong> {hint}</p>}
      
      {/* Comment section */}
      <div className="comment-section" style={{ marginTop: '10px' }}>
        {!isEditing && hasComment ? (
          <p
            className="popup-paragraph"
            style={{
              fontStyle: 'italic',
              cursor: 'pointer',
              padding: '5px',
              border: '1px solid transparent',
              borderRadius: '3px',
              transition: 'background-color 0.2s'
            }}
            onClick={handleCommentClick}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#f0f0f0'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
          >
            <strong>Commentaire :</strong> {comment}
          </p>
        ) : (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
              style={{ width: '95%', resize: 'vertical', borderRadius: '3px', border: '1px solid #ccc' }}
            />
            <button
              className="popup-button flash"
              type="button"
              onClick={handleSaveComment}
              disabled={isSaving || !comment.trim()}
              style={{
                marginTop: '5px',
                opacity: (!comment.trim() || isSaving) ? 0.5 : 1,
                cursor: (!comment.trim() || isSaving) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Comment'}
            </button>
          </>
        )}
      </div>

      <div className="actions-section" style={{ marginTop: '10px', paddingTop: '5px', borderTop: '1px solid #ccc' }}>
        {flashable ? (
          <>
            <button type="button" className={`popup-button ${flashed ? 'unflash' : 'flash'}`} onClick={() => onStatusUpdate(id, flashed ? 'unflash' : 'flash')}>
              {flashed ? 'Unflash' : 'Flash'}
            </button>
            <button type="button" className="popup-button disable" onClick={() => onStatusUpdate(id, 'disable')}>Disable</button>
          </>
        ) : (
          <button type="button" className="popup-button enable" onClick={() => onStatusUpdate(id, 'enable')}>Enable</button>
        )}
      </div>

    </div>
  );
}

export default PopupContent;
