import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const disasterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum([
    "Flood",
    "Earthquake",
    "Cyclone",
    "Landslide",
    "Wildfire",
    "Drought",
    "Industrial_Accident",
    "Other",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Active", "Monitoring", "Resolved"]).default("Active"),
  affectedArea: z.string().min(2, "Affected area is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  estimatedPopulation: z.number().int().nonnegative().default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
});

export const warehouseSchema = z.object({
  name: z.string().min(3, "Warehouse name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().positive("Capacity must be greater than 0"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(5, "Phone number is required"),
  currentUtilization: z.number().min(0).max(100).default(0),
});

export const resourceSchema = z.object({
  name: z.string().min(2, "Resource name is required"),
  category: z.enum([
    "Food",
    "Water",
    "Medicine",
    "Clothing",
    "Blankets",
    "Tents",
    "Rescue_Equipment",
    "Fuel",
    "Hygiene_Kits",
    "Medical_Equipment",
    "Other",
  ]),
  unit: z.string().min(1, "Unit is required (e.g. kg, liters, kits)"),
  quantity: z.number().int().nonnegative("Quantity cannot be negative"),
  minStockLevel: z.number().int().nonnegative().default(10),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  warehouseId: z.string().min(1, "Warehouse selection is required"),
});

export const reliefCenterSchema = z.object({
  name: z.string().min(3, "Relief center name is required"),
  type: z.enum(["Relief_Camp", "Hospital", "Shelter", "Mobile_Unit"]),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().positive("Capacity must be positive"),
  currentPopulation: z.number().int().nonnegative().default(0),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(5, "Phone is required"),
  emergencyLevel: z.enum(["Normal", "High", "Critical"]).default("Normal"),
});

export const requestItemSchema = z.object({
  resourceId: z.string().optional(),
  category: z.enum([
    "Food",
    "Water",
    "Medicine",
    "Clothing",
    "Blankets",
    "Tents",
    "Rescue_Equipment",
    "Fuel",
    "Hygiene_Kits",
    "Medical_Equipment",
    "Other",
  ]),
  requestedQuantity: z.number().int().positive("Requested quantity must be at least 1"),
});

export const resourceRequestSchema = z.object({
  disasterId: z.string().min(1, "Disaster selection is required"),
  destinationCenterId: z.string().min(1, "Relief camp/hospital selection is required"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  justification: z.string().min(5, "Please provide a justification for this request"),
  items: z.array(requestItemSchema).min(1, "At least one item must be requested"),
});

export const allocationSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  resourceId: z.string().min(1, "Resource selection is required"),
  allocatedQuantity: z.number().int().positive("Allocated quantity must be positive"),
  notes: z.string().optional(),
});

export const deliverySchema = z.object({
  requestId: z.string().min(1, "Request selection is required"),
  sourceWarehouseId: z.string().min(1, "Warehouse selection is required"),
  destinationCenterId: z.string().min(1, "Destination center is required"),
  assignedVehicle: z.string().min(2, "Vehicle details required (e.g. Truck-04)"),
  driverName: z.string().min(2, "Driver name is required"),
  driverPhone: z.string().min(5, "Driver phone is required"),
  estimatedArrival: z.string().or(z.date()).optional(),
  trackingNotes: z.string().optional(),
});

export const volunteerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Phone is required"),
  skills: z.string().min(2, "Skills are required"),
  availability: z.enum(["Available", "Deployed", "On_Leave"]).default("Available"),
  location: z.string().min(2, "Location is required"),
  assignedDisasterId: z.string().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(3, "Task title is required"),
  description: z.string().min(5, "Description is required"),
  disasterId: z.string().min(1, "Disaster is required"),
  assignedVolunteerId: z.string().optional().nullable(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  status: z.enum(["Pending", "In_Progress", "Completed", "Cancelled"]).default("Pending"),
  dueDate: z.string().or(z.date()).optional().nullable(),
});
