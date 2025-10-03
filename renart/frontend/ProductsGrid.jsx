
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default function ProductsGrid() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apiBase = import.meta?.env?.VITE_API_URL || 'http://localhost:4000';
        const resp = await axios.get(`${apiBase}/products`);
        const items = resp.data?.products || [];
        if (!Array.isArray(items) || items.length === 0) {
          setError('Ürün bulunamadı');
        }
        setProducts(items); 
      } catch (e) {
        console.error(e);
        setError('Sunucuya bağlanılamadı');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '80px 0' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 80 
      }}>
        <div style={{
          fontFamily: 'AvenirBook', 
          fontSize: 45, 
          fontWeight: 500,
          color: '#333',
          marginBottom: 8
        }}>
          Product List
        </div>
      </div>
      
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#555', marginBottom: 16, fontFamily: 'AvenirBook' }}>Loading...</div>
        )}
        {(!loading && error) && (
          <div style={{ textAlign: 'center', color: '#c00', marginBottom: 16, fontFamily: 'AvenirBook' }}>{error}</div>
        )}

        {products.length > 0 && (
          <>
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              spaceBetween={64}
              slidesPerView={4}
              className="outer-swiper"
              breakpoints={{
                0: { slidesPerView: 1.2, spaceBetween: 15 },
                640: { slidesPerView: 2, spaceBetween: 20 },
                900: { slidesPerView: 3, spaceBetween: 40 },
                1200: { slidesPerView: 4, spaceBetween: 64 }
              }}
            >
              {products.map((p, idx) => (
                <SwiperSlide key={idx}>
                  <ProductCard product={p} />
                </SwiperSlide>
              ))}
            </Swiper>
         <div className="swiper-button-prev-custom" style={arrowStyle('left')}>&lt;</div>
         <div className="swiper-button-next-custom" style={arrowStyle('right')}>&gt;</div>
          </>
        )}
        
      </div>
      </div>
  );
}

const arrowStyle = (direction) => ({
  [direction]: -30,
  position: 'absolute',
  top: '45%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
  zIndex: 10,
  fontSize: '40px',
  padding: 0,
});