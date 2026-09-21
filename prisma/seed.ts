import { PrismaClient, Role, DisasterType, SeverityLevel, DisasterStatus, ResourceCategory, ResourceStatus, CenterType, EmergencyLevel, RequestPriority, RequestStatus, AllocationStatus, DeliveryStatus, VolunteerAvailability, TaskPriority, TaskStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Disaster Relief System Database Seeding...");

  // Clear existing data in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.resourceAllocation.deleteMany();
  await prisma.requestItem.deleteMany();
  await prisma.resourceRequest.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.reliefCenter.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.disaster.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash("password123", 10);

  // 1. Create Relief Centers
  const campAlpha = await prisma.reliefCenter.create({
    data: {
      name: "River Valley Relief Camp",
      type: CenterType.Relief_Camp,
      address: "Sector 4, Riverbed Hwy",
      city: "Kochi",
      state: "Kerala",
      latitude: 9.9312,
      longitude: 76.2673,
      capacity: 1200,
      currentPopulation: 850,
      contactPerson: "Dr. Ananya Nair",
      phone: "+91 98765 43210",
      emergencyLevel: EmergencyLevel.High,
    },
  });

  const hospitalBeta = await prisma.reliefCenter.create({
    data: {
      name: "City Emergency Hospital",
      type: CenterType.Hospital,
      address: "102 Station Road",
      city: "Kochi",
      state: "Kerala",
      latitude: 9.9700,
      longitude: 76.2800,
      capacity: 400,
      currentPopulation: 380,
      contactPerson: "Dr. Rajesh Kumar",
      phone: "+91 98765 11223",
      emergencyLevel: EmergencyLevel.Critical,
    },
  });

  const shelterNorth = await prisma.reliefCenter.create({
    data: {
      name: "Himalayan Emergency Shelter",
      type: CenterType.Shelter,
      address: "Pine Ridge Base",
      city: "Shimla",
      state: "Himachal Pradesh",
      latitude: 31.1048,
      longitude: 77.1734,
      capacity: 600,
      currentPopulation: 420,
      contactPerson: "Captain Vikram Singh",
      phone: "+91 98111 22334",
      emergencyLevel: EmergencyLevel.High,
    },
  });

  const shelterCoastal = await prisma.reliefCenter.create({
    data: {
      name: "Coastal Cyclone Relief Hub",
      type: CenterType.Relief_Camp,
      address: "Port Road 12",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      latitude: 17.6868,
      longitude: 83.2185,
      capacity: 2000,
      currentPopulation: 1450,
      contactPerson: "Sujata Rao",
      phone: "+91 98444 55667",
      emergencyLevel: EmergencyLevel.Critical,
    },
  });

  // 2. Create Warehouses
  const warehouseCentral = await prisma.warehouse.create({
    data: {
      name: "Central Logistics Hub",
      address: "Plot 45, Industrial Zone",
      city: "Kochi",
      state: "Kerala",
      latitude: 9.9816,
      longitude: 76.2999,
      capacity: 5000,
      contactPerson: "Suresh Menon",
      phone: "+91 99000 11122",
      currentUtilization: 68.5,
    },
  });

  const warehouseNorth = await prisma.warehouse.create({
    data: {
      name: "Northern Relief Depot",
      address: "Highway Depot 9",
      city: "Chandigarh",
      state: "Punjab",
      latitude: 30.7333,
      longitude: 76.7794,
      capacity: 3500,
      contactPerson: "Harpreet Singh",
      phone: "+91 99111 33344",
      currentUtilization: 45.0,
    },
  });

  const warehouseEast = await prisma.warehouse.create({
    data: {
      name: "Eastern Coastal Warehouse",
      address: "Harbor Freight Yard",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      latitude: 17.7000,
      longitude: 83.3000,
      capacity: 4000,
      contactPerson: "Venkatesh Prasad",
      phone: "+91 99222 44455",
      currentUtilization: 82.0,
    },
  });

  // 3. Create Core Users with Roles
  const adminUser = await prisma.user.create({
    data: {
      name: "Sarah Jenkins (Admin)",
      email: "admin@disaster.org",
      password: defaultPassword,
      role: Role.ADMIN,
      phone: "+91 90000 00001",
    },
  });

  const officerUser = await prisma.user.create({
    data: {
      name: "Cmdr. Robert Chen",
      email: "officer@disaster.org",
      password: defaultPassword,
      role: Role.DISASTER_OFFICER,
      phone: "+91 90000 00002",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: "manager@disaster.org",
      password: defaultPassword,
      role: Role.RESOURCE_MANAGER,
      phone: "+91 90000 00003",
      warehouseId: warehouseCentral.id,
    },
  });

  const campManagerUser = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "camp@disaster.org",
      password: defaultPassword,
      role: Role.RELIEF_CAMP_MANAGER,
      phone: "+91 90000 00004",
      reliefCenterId: campAlpha.id,
    },
  });

  const volunteerUser = await prisma.user.create({
    data: {
      name: "David Miller",
      email: "volunteer@disaster.org",
      password: defaultPassword,
      role: Role.VOLUNTEER,
      phone: "+91 90000 00005",
    },
  });

  // 4. Create Active Disasters
  const disasterFlood = await prisma.disaster.create({
    data: {
      name: "Monsoon Flash Floods 2026",
      type: DisasterType.Flood,
      description: "Severe flash flooding triggered by 72 hours of incessant heavy monsoon rain across 4 districts.",
      severity: SeverityLevel.Critical,
      status: DisasterStatus.Active,
      affectedArea: "Ernakulam & Wayanad Districts",
      latitude: 9.9312,
      longitude: 76.2673,
      estimatedPopulation: 145000,
      startDate: new Date("2026-09-10"),
      createdById: officerUser.id,
    },
  });

  const disasterLandslide = await prisma.disaster.create({
    data: {
      name: "Himalayan Ridge Landslide",
      type: DisasterType.Landslide,
      description: "Massive hill slope collapse blocking main highway supply routes and isolating high-altitude villages.",
      severity: SeverityLevel.High,
      status: DisasterStatus.Active,
      affectedArea: "Shimla-Kinnaur Belt",
      latitude: 31.1048,
      longitude: 77.1734,
      estimatedPopulation: 38000,
      startDate: new Date("2026-09-15"),
      createdById: officerUser.id,
    },
  });

  const disasterCyclone = await prisma.disaster.create({
    data: {
      name: "Cyclone Vardah II",
      type: DisasterType.Cyclone,
      description: "Category 4 tropical cyclone landfall causing massive coastal surge, wind damage, and power disruption.",
      severity: SeverityLevel.Critical,
      status: DisasterStatus.Active,
      affectedArea: "Coastal Andhra & Vizag",
      latitude: 17.6868,
      longitude: 83.2185,
      estimatedPopulation: 220000,
      startDate: new Date("2026-09-18"),
      createdById: officerUser.id,
    },
  });

  // 5. Create Resources in Warehouses
  const resCleanWater = await prisma.resource.create({
    data: {
      name: "Drinking Water Cans (20L)",
      category: ResourceCategory.Water,
      unit: "cans",
      quantity: 1200,
      minStockLevel: 300,
      warehouseId: warehouseCentral.id,
      status: ResourceStatus.Available,
    },
  });

  const resRationKits = await prisma.resource.create({
    data: {
      name: "Emergency Dry Food Ration Kits",
      category: ResourceCategory.Food,
      unit: "kits",
      quantity: 2500,
      minStockLevel: 500,
      warehouseId: warehouseCentral.id,
      status: ResourceStatus.Available,
    },
  });

  const resAntibiotics = await prisma.resource.create({
    data: {
      name: "Broad Spectrum Antibiotics & IV Sets",
      category: ResourceCategory.Medicine,
      unit: "boxes",
      quantity: 80,
      minStockLevel: 100,
      expiryDate: new Date("2027-06-30"),
      warehouseId: warehouseCentral.id,
      status: ResourceStatus.Low_Stock,
    },
  });

  const resTents = await prisma.resource.create({
    data: {
      name: "Weatherproof Family Relief Tents",
      category: ResourceCategory.Tents,
      unit: "tents",
      quantity: 450,
      minStockLevel: 100,
      warehouseId: warehouseCentral.id,
      status: ResourceStatus.Available,
    },
  });

  const resBlankets = await prisma.resource.create({
    data: {
      name: "Thermal Insulation Blankets",
      category: ResourceCategory.Blankets,
      unit: "units",
      quantity: 3000,
      minStockLevel: 400,
      warehouseId: warehouseNorth.id,
      status: ResourceStatus.Available,
    },
  });

  const resFirstAid = await prisma.resource.create({
    data: {
      name: "Trauma First Aid & Surgery Supplies",
      category: ResourceCategory.Medical_Equipment,
      unit: "kits",
      quantity: 150,
      minStockLevel: 50,
      warehouseId: warehouseNorth.id,
      status: ResourceStatus.Available,
    },
  });

  const resHygiene = await prisma.resource.create({
    data: {
      name: "Personal Hygiene & Sanitation Kits",
      category: ResourceCategory.Hygiene_Kits,
      unit: "kits",
      quantity: 1800,
      minStockLevel: 300,
      warehouseId: warehouseEast.id,
      status: ResourceStatus.Available,
    },
  });

  const resDiesel = await prisma.resource.create({
    data: {
      name: "Generator Fuel (Diesel Drums)",
      category: ResourceCategory.Fuel,
      unit: "liters",
      quantity: 5000,
      minStockLevel: 1000,
      warehouseId: warehouseEast.id,
      status: ResourceStatus.Available,
    },
  });

  const resInflatableBoats = await prisma.resource.create({
    data: {
      name: "Motorized Rescue Inflatable Boats",
      category: ResourceCategory.Rescue_Equipment,
      unit: "boats",
      quantity: 12,
      minStockLevel: 5,
      warehouseId: warehouseCentral.id,
      status: ResourceStatus.Available,
    },
  });

  // 6. Create Volunteers
  const vol1 = await prisma.volunteer.create({
    data: {
      userId: volunteerUser.id,
      name: "David Miller",
      email: "volunteer@disaster.org",
      phone: "+91 90000 00005",
      skills: "First Aid, Water Rescue, HAM Radio",
      availability: VolunteerAvailability.Deployed,
      location: "Kochi, Kerala",
      assignedDisasterId: disasterFlood.id,
    },
  });

  const vol2 = await prisma.volunteer.create({
    data: {
      name: "Priya Sharma",
      email: "priya.s@relief.org",
      phone: "+91 98222 77889",
      skills: "Medical Triage, Trauma Nursing, Child Care",
      availability: VolunteerAvailability.Deployed,
      location: "Shimla, HP",
      assignedDisasterId: disasterLandslide.id,
    },
  });

  const vol3 = await prisma.volunteer.create({
    data: {
      name: "Arun Varma",
      email: "arun.v@volunteers.in",
      phone: "+91 97333 44556",
      skills: "Heavy Machinery Driving, Structural Clearance",
      availability: VolunteerAvailability.Available,
      location: "Visakhapatnam",
      assignedDisasterId: disasterCyclone.id,
    },
  });

  // 7. Create Tasks
  await prisma.task.create({
    data: {
      title: "Deploy Water Purification Units at Sector 4",
      description: "Set up 5 clean water filter stations for flood displaced families.",
      disasterId: disasterFlood.id,
      assignedVolunteerId: vol1.id,
      priority: TaskPriority.Critical,
      status: TaskStatus.In_Progress,
      dueDate: new Date("2026-09-24"),
    },
  });

  await prisma.task.create({
    data: {
      title: "Clear Landslide Debris near Highway Mile 14",
      description: "Coordinate with heavy earthmovers to clear passage for ambulance access.",
      disasterId: disasterLandslide.id,
      assignedVolunteerId: vol3.id,
      priority: TaskPriority.High,
      status: TaskStatus.Pending,
      dueDate: new Date("2026-09-23"),
    },
  });

  await prisma.task.create({
    data: {
      title: "Distribute Thermal Blankets to North Shelter",
      description: "Unload and distribute 400 insulation blankets to cold wave affected families.",
      disasterId: disasterLandslide.id,
      assignedVolunteerId: vol2.id,
      priority: TaskPriority.Medium,
      status: TaskStatus.Completed,
      dueDate: new Date("2026-09-20"),
    },
  });

  // 8. Create Resource Requests & Allocations & Deliveries
  // Request 1: Critical Water & Medicines for River Valley Camp
  const request1 = await prisma.resourceRequest.create({
    data: {
      requesterId: campManagerUser.id,
      disasterId: disasterFlood.id,
      destinationCenterId: campAlpha.id,
      priority: RequestPriority.Critical,
      justification: "Flood waters contaminated local well supply. 850 campers urgently need clean drinking water and oral rehydration therapy.",
      status: RequestStatus.Approved,
      requestedDate: new Date("2026-09-19T10:00:00Z"),
      approvedDate: new Date("2026-09-19T11:30:00Z"),
      items: {
        create: [
          {
            category: ResourceCategory.Water,
            resourceId: resCleanWater.id,
            requestedQuantity: 300,
            fulfilledQuantity: 300,
          },
          {
            category: ResourceCategory.Medicine,
            resourceId: resAntibiotics.id,
            requestedQuantity: 20,
            fulfilledQuantity: 20,
          },
        ],
      },
    },
  });

  // Allocation for Request 1
  const alloc1 = await prisma.resourceAllocation.create({
    data: {
      requestId: request1.id,
      resourceId: resCleanWater.id,
      allocatedQuantity: 300,
      allocatedById: officerUser.id,
      status: AllocationStatus.Dispatched,
      notes: "Allocated from Central Logistics Hub",
    },
  });

  const alloc2 = await prisma.resourceAllocation.create({
    data: {
      requestId: request1.id,
      resourceId: resAntibiotics.id,
      allocatedQuantity: 20,
      allocatedById: officerUser.id,
      status: AllocationStatus.Dispatched,
      notes: "Allocated from Central Logistics Hub",
    },
  });

  // Delivery for Request 1
  await prisma.delivery.create({
    data: {
      requestId: request1.id,
      sourceWarehouseId: warehouseCentral.id,
      destinationCenterId: campAlpha.id,
      assignedVehicle: "Heavy Relief Truck (KL-07-BX-4040)",
      driverName: "Ramesh Chandran",
      driverPhone: "+91 94444 88899",
      status: DeliveryStatus.In_Transit,
      departureTime: new Date("2026-09-19T14:00:00Z"),
      estimatedArrival: new Date("2026-09-21T20:00:00Z"),
      trackingNotes: "Dispatched under police convoy escort due to high water on route 4.",
      items: {
        create: [
          { resourceId: resCleanWater.id, allocationId: alloc1.id, quantity: 300 },
          { resourceId: resAntibiotics.id, allocationId: alloc2.id, quantity: 20 },
        ],
      },
    },
  });

  // Request 2: Food & Tents for City Hospital
  const request2 = await prisma.resourceRequest.create({
    data: {
      requesterId: adminUser.id,
      disasterId: disasterFlood.id,
      destinationCenterId: hospitalBeta.id,
      priority: RequestPriority.High,
      justification: "Hospital annex expanded with temporary outdoor emergency wards.",
      status: RequestStatus.Fulfilled,
      requestedDate: new Date("2026-09-17T08:00:00Z"),
      approvedDate: new Date("2026-09-17T09:00:00Z"),
      fulfilledDate: new Date("2026-09-18T16:00:00Z"),
      items: {
        create: [
          {
            category: ResourceCategory.Tents,
            resourceId: resTents.id,
            requestedQuantity: 50,
            fulfilledQuantity: 50,
          },
          {
            category: ResourceCategory.Food,
            resourceId: resRationKits.id,
            requestedQuantity: 400,
            fulfilledQuantity: 400,
          },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      requestId: request2.id,
      sourceWarehouseId: warehouseCentral.id,
      destinationCenterId: hospitalBeta.id,
      assignedVehicle: "Express Cargo Van (KL-07-AZ-1010)",
      driverName: "Manoj Nair",
      driverPhone: "+91 94444 11223",
      status: DeliveryStatus.Delivered,
      departureTime: new Date("2026-09-17T11:00:00Z"),
      actualArrival: new Date("2026-09-18T15:30:00Z"),
      trackingNotes: "Delivered directly to Emergency Bay 2. Received and verified by Dr. Rajesh.",
    },
  });

  // Request 3: Pending Request for Cyclone Relief
  await prisma.resourceRequest.create({
    data: {
      requesterId: officerUser.id,
      disasterId: disasterCyclone.id,
      destinationCenterId: shelterCoastal.id,
      priority: RequestPriority.Critical,
      justification: "Coastal power grid down. Generator fuel and hygiene kits required for 1450 evacuees.",
      status: RequestStatus.Pending,
      requestedDate: new Date("2026-09-21T09:00:00Z"),
      items: {
        create: [
          {
            category: ResourceCategory.Fuel,
            resourceId: resDiesel.id,
            requestedQuantity: 1500,
            fulfilledQuantity: 0,
          },
          {
            category: ResourceCategory.Hygiene_Kits,
            resourceId: resHygiene.id,
            requestedQuantity: 600,
            fulfilledQuantity: 0,
          },
        ],
      },
    },
  });

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: "CRITICAL REQUEST: Generator Fuel Needed",
        message: "Coastal Cyclone Relief Hub requested 1500L Diesel fuel urgently.",
        type: NotificationType.CRITICAL_REQUEST,
        isRead: false,
        link: "/requests",
      },
      {
        title: "LOW STOCK WARNING: Antibiotics",
        message: "Broad Spectrum Antibiotics inventory dropped below minimum threshold (80 remaining).",
        type: NotificationType.LOW_INVENTORY,
        isRead: false,
        link: "/inventory",
      },
      {
        title: "DELIVERY IN TRANSIT: Cargo KL-07-BX-4040",
        message: "Relief convoy carrying water and medical supplies is en route to River Valley Camp.",
        type: NotificationType.DELIVERY_UPDATE,
        isRead: true,
        link: "/deliveries",
      },
      {
        title: "NEW DISASTER ALERT: Cyclone Vardah II",
        message: "Category 4 Cyclone updated to Critical status along Vizag coastline.",
        type: NotificationType.DISASTER_ALERT,
        isRead: true,
        link: "/disasters",
      },
    ],
  });

  // 10. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: "SYSTEM_BOOTSTRAP",
        entity: "SYSTEM",
        entityId: "SYSTEM",
        performedById: adminUser.id,
        details: "Disaster Relief Resource Management System database initialized.",
      },
      {
        action: "DISASTER_CREATED",
        entity: "Disaster",
        entityId: disasterFlood.id,
        performedById: officerUser.id,
        details: "Created incident: Monsoon Flash Floods 2026 (Severity: Critical).",
      },
      {
        action: "REQUEST_APPROVED",
        entity: "ResourceRequest",
        entityId: request1.id,
        performedById: officerUser.id,
        details: "Approved critical request for 300 Water cans & 20 Medicine boxes.",
      },
      {
        action: "DELIVERY_DISPATCHED",
        entity: "Delivery",
        entityId: request1.id,
        performedById: managerUser.id,
        details: "Dispatched Truck KL-07-BX-4040 from Central Logistics Hub.",
      },
    ],
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
