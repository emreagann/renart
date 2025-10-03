import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';

export default function ProductCard({ product }) {
  const safeImages = product?.images && typeof product.images === 'object' ? product.images : {};
  const colorKeys = ['yellow', 'white', 'rose'].filter(k => safeImages[k]);
  const [selected, setSelected] = useState(colorKeys[0] || 'yellow');
  const swiperRef = useRef(null);

  const colorHex = { yellow: '#E6CA97', white: '#D9D9D9', rose: '#E1A4A9' };

  const starDisplay = (rating) => {
    const fullStars = Math.round(rating);
    const emptyStars = 5 - fullStars;
    return (
      <span style={{ color: '#f5b301', letterSpacing: '0.1em' }}>
        {'★'.repeat(fullStars)}
        <span style={{ color: '#ddd' }}>{'★'.repeat(emptyStars)}</span>
      </span>
    );
  };
  
  const getSelectedColorName = (key) => {
    switch(key) {
      case 'yellow': return 'Yellow Gold';
      case 'white': return 'White Gold';
      case 'rose': return 'Rose Gold';
      default: return 'Gold';
    }
  }

  return (
    <div className="product-card" style={{ background: '#fff', padding: 0, margin: 0 ,display:'flex', flexDirection:'column',justifyContent:'space-between',height:'400px'}}>
      <div style={{ height: 280, background: '#f7f7f7', overflow: 'hidden', marginBottom: 16,borderRadius:'16px' }}>
        <Swiper className="image-swiper" onSwiper={(s)=> (swiperRef.current = s)} spaceBetween={0} slidesPerView={1}>
          {colorKeys.map((k, index) => (
            <SwiperSlide key={k}>
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <img
                  src={safeImages[k] || ''}
                  alt={`${product?.name || 'Ürün'} - ${getSelectedColorName(k)}`}
                  style={{maxWidth:"90%", maxHeight:"90%", objectFit:"contain"}}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      <div style={{ padding: '0 8px' }}>
        <h3 style={{
          fontFamily: 'MonserratMedium', 
          fontSize: 15,
          fontWeight: 'normal',
          margin: '0 0 4px 0',
        }}>{product?.name || 'Product Title'}</h3>
        
        <p style={{
          fontFamily: 'MontserratRegular', 
          fontSize: 15,
          margin: '0 0 12px 0',
        }}>${Number(product?.priceUsd ?? 101.00).toFixed(2)} USD</p>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 16,
          paddingTop: 8, 
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,fontFamily: 'AvenirBook',fontSize: 12}}>
            {colorKeys.map((k, idx) => {
              const isSelected = selected === k;
              return (
                <button
                  key={k}
                  aria-label={`select ${getSelectedColorName(k)}`}
                  onClick={() => {
                    setSelected(k);
                    if (swiperRef.current && idx >= 0) swiperRef.current.slideTo(idx);
                  }}
                  style={{
                    width: 18,
                    height:18,
                    borderRadius: '50%',
                    background: colorHex[k] || '#ddd',
                    border: '1px solid #000',
                    boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${colorHex[k]}` : 'none',
                    cursor: 'pointer',
                    outline: isSelected ? 'none' : '1px solid #ccc',
                    outlineOffset: isSelected ? '0' : '0',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>

          
        </div>
        
        <p style={{
          fontFamily: 'AvenirBook',
          fontSize: 12,
          color: '#555',
          margin: '0 0 12px 0',
          fontWeight:'bold'
        }}>
          {getSelectedColorName(selected)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {starDisplay(product?.popularityOutOf5)}
            <span style={{ 
              fontSize: 14,
              fontFamily: 'AvenirBook',
              color: '#000',
                 fontWeight:'normal'
            }}>
              {Number(product?.popularityOutOf5 ?? 0).toFixed(1)}/5
            </span>
          </div>
      </div>
    </div>
  );
}