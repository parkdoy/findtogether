import { Timestamp } from 'firebase/firestore';
import type { Post } from '../../types';

const mockreports = [
  {
    id: 'r1',
    authorName: '제보자1',
    time: new Date().toISOString(),
    lat: 65.123,
    lng: -23.456,
    geocodedAddress: 'Seoul, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    createdAt: Timestamp.now()
  },
  {
    id: 'r2',
    authorName: '제보자2',
    time: new Date().toISOString(),
    geocodedAddress: 'Busan, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  },
  {
    id: 'r3',
    authorName: '제보자3',
    time: new Date().toISOString(),
    geocodedAddress: 'Incheon, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  },
  {
    id: 'r4',
    authorName: '제보자4',
    time: new Date().toISOString(),
    geocodedAddress: 'Daegu, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  },
  {
    id: 'r5',
    authorName: '제보자5',
    time: new Date().toISOString(),
    geocodedAddress: 'Gwangju, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  },
  {
    id: 'r6',
    authorName: '제보자6',
    time: new Date().toISOString(),
    geocodedAddress: 'Jeju, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  },
  {
    id: 'r7',
    authorName: '제보자7',
    time: new Date().toISOString(),
    geocodedAddress: 'Ulsan, South Korea',
    description: '이 고양이를 봤어요!',
    imageUrl: '',
    lat: 65.123,
    lng: -23.456,
    createdAt: Timestamp.now()
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    name: '목업 데이터 1',
    authorId: 'mockuser1',
    authorName: '테스트유저1',
    features: '흰색, 매우 활발함',
    lastSeenTime: new Date().toISOString(),
    imageUrl: '',
    reports: [mockreports[0], mockreports[1], mockreports[2], mockreports[3], mockreports[4], mockreports[5], mockreports[6]],
    lastSeenLocation: { lat: 65.123, lng: -23.456 },
    createdAt: Timestamp.now(),
  },
  {
    id: '2',
    name: '목업 데이터 2',
    authorId: 'mockuser2',
    authorName: '테스트유저2',
    features: '검은색, 조용함',
    lastSeenTime: new Date().toISOString(),
    imageUrl: '',
    reports: [mockreports[0], mockreports[1], mockreports[2], mockreports[3], mockreports[4], mockreports[5], mockreports[6]],
    lastSeenLocation: { lat: 65.123, lng: -23.456 },
    createdAt: Timestamp.now(),
  },
  {
    id: '3',
    name: '목업 데이터 3',
    authorId: 'mockuser3',
    authorName: '테스트유저3',
    features: '얼룩무늬, 경계심 많음',
    lastSeenTime: new Date().toISOString(),
    imageUrl: '',
    reports: [mockreports[0], mockreports[1], mockreports[2], mockreports[3], mockreports[4], mockreports[5], mockreports[6]],
    lastSeenLocation: { lat: 65.123, lng: -23.456 },
    createdAt: Timestamp.now()
  }
];