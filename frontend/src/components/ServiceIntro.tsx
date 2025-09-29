import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

import './ServiceIntro.css';

// Placeholder data for the cards
const introCards = [
  {
    icon: '🗺️',
    title: '지도를 이용한 위치 확인',
    description: '잃어버린 반려동물이나 실종자의 마지막 위치를 지도에서 쉽게 확인하고, 제보된 위치들을 한눈에 파악할 수 있습니다.',
  },
  {
    icon: '✍️',
    title: '간편한 등록 및 제보',
    description: '몇 가지 간단한 정보만으로 실종 게시물을 등록할 수 있습니다. 목격자는 사진과 함께 간편하게 제보를 남길 수 있습니다.',
  },
  {
    icon: '🤝',
    title: '함께 찾는 커뮤니티',
    description: "'함께찾기'는 모든 사용자가 함께 잃어버린 소중한 것들을 찾을 수 있도록 돕는 따뜻한 커뮤니티 공간입니다.",
  },
  {
    icon: '🔔',
    title: '실시간 업데이트',
    description: '새로운 제보가 등록되면 게시물에 실시간으로 업데이트되어 진행 상황을 빠르게 확인할 수 있습니다.',
  },
  {
    icon: '🛠️',
    title: '개선 사항 및 피드백',
    description: '사용자의 의견을 적극 반영하여 서비스 개선에 최선을 다하겠습니다.\n 언제든지 피드백을 보내주세요!\n 📧: swagee7@gmail.com',
  },
];

const ServiceIntro: React.FC = () => {
  return (
    <div className="service-intro-container">
      <h2>서비스 소개</h2>
      <Swiper
        modules={[Pagination]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        className="intro-swiper"
      >
        {introCards.map((card, index) => (
          <SwiperSlide key={index} className="intro-slide">
            <div className="intro-card">
              <div className="card-icon">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ServiceIntro;
