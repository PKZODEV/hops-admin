import { DashboardMetrics, SetupStatus, Booking, RoomType } from '../types';

export const mockDashboardMetrics: DashboardMetrics = {
    totalBookings: 256,
    bookingsTrend: 12,
    occupancyRate: 78,
    occupancyTrend: 5,
    revenue: 45231,
    revenueTrend: 18,
    activeAdmins: 12,
    adminsTrend: 2,
};

export const mockSetupStatus: SetupStatus = {
    completedSteps: 0,
    totalSteps: 5,
    isComplete: false,
    steps: [
        {
            id: 'hotel-info',
            title: 'ข้อมูลโรงแรม',
            description: 'ชื่อโรงแรม สิ่งอำนวยความสะดวก และรูปภาพ',
            isCompleted: false,
            isRequired: true,
        },
        {
            id: 'building',
            title: 'อาคารและชั้น',
            description: 'กำหนดอาคารและชั้นของโรงแรม',
            isCompleted: false,
            isRequired: true,
        },
        {
            id: 'room-types',
            title: 'สร้างห้องพัก',
            description: 'เพิ่มห้องพักและประเภทห้อง',
            isCompleted: false,
            isRequired: true,
        },
        {
            id: 'room-setup',
            title: 'ตั้งค่าห้องพัก',
            description: 'กำหนดราคาสำหรับแต่ละประเภทห้อง',
            isCompleted: false,
            isRequired: true,
        },
        {
            id: 'room-status',
            title: 'สถานะห้องพัก',
            description: 'จัดการสถานะห้องพัก',
            isCompleted: false,
            isRequired: true,
        }
    ],
};

export const mockRecentBookings: Booking[] = [
    {
        id: 'b1',
        guestName: 'John Smith',
        roomTypeId: 'rt1',
        roomName: 'Deluxe Suite 301',
        checkIn: '16 ก.พ. 2569',
        checkOut: '18 ก.พ. 2569',
        status: 'CONFIRMED',
    },
    {
        id: 'b2',
        guestName: 'Sarah Johnson',
        roomTypeId: 'rt2',
        roomName: 'Standard Room 205',
        checkIn: '15 ก.พ. 2569',
        checkOut: '17 ก.พ. 2569',
        status: 'CHECKED_IN',
    },
    {
        id: 'b3',
        guestName: 'Michael Brown',
        roomTypeId: 'rt3',
        roomName: 'Executive Suite 401',
        checkIn: '15 ก.พ. 2569',
        checkOut: '19 ก.พ. 2569',
        status: 'CONFIRMED',
    },
    {
        id: 'b4',
        guestName: 'Emily Davis',
        roomTypeId: 'rt2',
        roomName: 'Standard Room 102',
        checkIn: '14 ก.พ. 2569',
        checkOut: '16 ก.พ. 2569',
        status: 'CHECKED_OUT',
    }
];

export const mockRoomTypes: RoomType[] = [
    {
        id: 'rt1',
        name: 'Deluxe Suite',
        maxGuests: 4,
        bedType: 'King Bed',
        pricePerNight: 5000,
        isActive: true,
    },
    {
        id: 'rt2',
        name: 'Standard Room',
        maxGuests: 2,
        bedType: 'Queen Bed',
        pricePerNight: 2000,
        isActive: true,
    },
    {
        id: 'rt3',
        name: 'Executive Suite',
        maxGuests: 4,
        bedType: 'King Bed + Sofa Bed',
        pricePerNight: 8000,
        isActive: false,
    }
];

export const mockRoomStatusCounts = {
    available: 42,
    occupied: 38,
    maintenance: 5,
    total: 85
};
