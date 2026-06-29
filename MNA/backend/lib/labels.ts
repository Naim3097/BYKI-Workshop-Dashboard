import type {
  MovementType,
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  ProductCategory,
  ServiceType,
} from './types'

export const categoryLabels: Record<ProductCategory, string> = {
  cvt_belt: 'CVT Belt & Variator',
  valve_body: 'Valve Body & Solenoid',
  torque_conv: 'Torque Converter',
  clutch_plate: 'Clutch Plate',
  steel_plate: 'Steel Plate',
  auto_filter: 'Auto Filter',
  forward_drum: 'Forward Drum',
  oil_pump: 'Oil Pump',
  piston_seal: 'Piston Seal',
  overhaul_kit: 'Overhaul Kit',
  lubricants: 'Lubricants',
}

export const channelLabels: Record<OrderChannel, string> = {
  retail: 'Retail',
  bulk: 'Bulk / B2B',
  owner: 'Owner portal',
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  cancelled: 'Cancelled',
  fulfilled: 'Fulfilled',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export const movementLabels: Record<MovementType, string> = {
  restock: 'Restock',
  sale: 'Sale',
  workshop_use: 'Workshop use',
  adjustment: 'Adjustment',
}

export const serviceLabels: Record<ServiceType, string> = {
  transmission_inspection: 'Transmission inspection',
  general_service: 'General service',
  diagnostic: 'Diagnostic scan',
  fluid_change: 'Fluid change',
}

export const serviceDeposits: Record<ServiceType, number> = {
  transmission_inspection: 80,
  general_service: 50,
  diagnostic: 60,
  fluid_change: 40,
}

export const timeSlots = [
  '09:00',
  '10:30',
  '12:00',
  '14:30',
  '16:00',
]
