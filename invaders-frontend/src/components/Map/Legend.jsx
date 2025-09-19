import React from 'react';

function Legend() {
  return (
    <div className="legend">
      <div><span style={{ color: 'rgb(37, 179, 37)' }}>●</span> Flashé</div>
      <div><span style={{ color: 'rgb(153, 77, 190)' }}>●</span> À Flasher</div>
      <div><span style={{ color: 'grey' }}>●</span> Impossible</div>
    </div>
  );
}

export default Legend;