export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export interface RoomType {
  id: string;
  name: string;
  maxGuests: number;
  bedType: string;
  pricePerNight: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  guestName: string;
  roomTypeId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
}

export interface DashboardMetrics {
  totalBookings: number;
  bookingsTrend: number;
  occupancyRate: number;
  occupancyTrend: number;
  revenue: number;
  revenueTrend: number;
  activeAdmins: number;
  adminsTrend: number;
}

export interface SetupStatus {
  completedSteps: number;
  totalSteps: number;
  isComplete: boolean;
  steps: {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    isRequired: boolean;
  }[];
}
