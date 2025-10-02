/**
 * Job Description Templates by Business Type
 * Auto-populated when employer selects a business
 */

export interface JobDescriptionTemplate {
  title: string;
  description: string;
}

export const JOB_DESCRIPTION_TEMPLATES: Record<string, JobDescriptionTemplate> = {
  restaurant: {
    title: 'Restaurant Staff (Server / Support)',
    description: `Join our team in providing excellent dining experiences. Responsibilities include greeting guests, taking orders, serving food and drinks, clearing tables, and maintaining cleanliness. Support kitchen and front-of-house operations as needed.

Duties:
• Welcome and assist customers with menu selections
• Deliver food/beverages promptly and accurately
• Keep dining area and service stations clean
• Handle payments and issue receipts
• Follow food safety and hygiene standards`,
  },

  gas_station: {
    title: 'Gas Station Attendant / Cashier',
    description: `Assist customers at a busy fueling station. Handle transactions, provide directions, and maintain a safe, clean environment.

Duties:
• Operate cash register and process fuel purchases
• Assist customers with fuel pumps when required
• Stock shelves and maintain product displays
• Monitor safety around fueling areas
• Perform light cleaning (restrooms, counters, pumps)`,
  },

  retail_store: {
    title: 'Retail Associate',
    description: `Support daily store operations and help customers with product selections. Maintain inventory and keep the store organized.

Duties:
• Greet and assist shoppers
• Stock shelves and replenish products
• Operate POS system for sales
• Keep aisles tidy and assist in merchandising
• Handle customer inquiries or returns`,
  },

  grocery_store: {
    title: 'Grocery Clerk / Stocker',
    description: `Help customers and ensure shelves are stocked with fresh products. Maintain cleanliness and assist with checkout if needed.

Duties:
• Stock shelves and rotate inventory
• Assist customers in finding items
• Bag groceries and help at checkout
• Keep aisles and storage clean
• Follow safety and food handling rules`,
  },

  convenience_store: {
    title: 'Store Clerk',
    description: `Work in a fast-paced environment, handling cashier duties, stocking products, and providing friendly service.

Duties:
• Greet customers and process purchases
• Refill shelves and coolers
• Monitor store security and cleanliness
• Assist with lottery, tobacco, or age-restricted items
• Provide quick, polite service`,
  },

  pharmacy: {
    title: 'Pharmacy Clerk / Assistant',
    description: `Assist customers with prescriptions and store products. Support pharmacists and maintain store order.

Duties:
• Greet customers and manage checkout
• Organize over-the-counter items
• Support prescription pick-up and drop-off
• Maintain confidentiality and compliance
• Keep pharmacy area neat and clean`,
  },

  coffee_shop: {
    title: 'Barista',
    description: `Prepare and serve coffee, tea, and snacks in a friendly café environment.

Duties:
• Greet and take customer orders
• Prepare espresso drinks and beverages
• Handle cash and card payments
• Restock ingredients and supplies
• Keep work area and seating clean`,
  },

  fast_food: {
    title: 'Crew Member',
    description: `Join a quick-service team preparing food, taking orders, and serving customers in a fast-paced environment.

Duties:
• Take orders at counter or drive-thru
• Assemble food and drink items
• Maintain kitchen and prep areas
• Keep dining and work areas clean
• Provide quick and accurate service`,
  },

  delivery_service: {
    title: 'Delivery Driver / Courier',
    description: `Deliver packages, food, or goods safely and on time to customers.

Duties:
• Pick up and deliver orders promptly
• Verify delivery addresses and payments
• Handle packages with care
• Follow traffic and safety rules
• Provide polite customer service`,
  },

  warehouse: {
    title: 'Warehouse Associate',
    description: `Support warehouse operations through packing, loading, and organizing inventory.

Duties:
• Receive and sort incoming stock
• Pick, pack, and ship orders
• Operate pallet jacks or forklifts (if trained)
• Maintain warehouse cleanliness
• Assist in inventory counts`,
  },

  office: {
    title: 'Office Assistant',
    description: `Provide administrative support including clerical tasks, communication, and file management.

Duties:
• Answer phones and greet visitors
• Organize files and documents
• Assist with scheduling and emails
• Maintain office supplies
• Support staff with day-to-day tasks`,
  },

  liquor_store: {
    title: 'Liquor Store Associate',
    description: `Assist customers with product selections in a retail alcohol and spirits environment. Check IDs, process sales, and maintain inventory.

Duties:
• Greet customers and provide product recommendations
• Verify customer age and check valid identification
• Process sales transactions and handle cash/card payments
• Stock shelves and organize inventory by category
• Maintain store cleanliness and comply with state regulations`,
  },

  smoke_vape_shop: {
    title: 'Smoke Shop / Vape Shop Associate',
    description: `Provide knowledgeable customer service in a tobacco and vaping products retail environment. Ensure compliance with age verification requirements.

Duties:
• Assist customers with product selection and education
• Verify age and check valid identification for all sales
• Operate point-of-sale system and process transactions
• Stock and organize tobacco, vaping, and accessory products
• Maintain clean and compliant retail environment`,
  },

  salon_barber: {
    title: 'Salon / Barber Shop Assistant',
    description: `Support salon or barbershop operations by assisting stylists, managing appointments, and maintaining a welcoming environment.

Duties:
• Greet clients and manage appointment scheduling
• Assist stylists with shampooing, blow-drying, and cleanup
• Maintain cleanliness of workstations and equipment
• Handle payments and product sales
• Restock supplies and launder towels`,
  },

  nail_beauty_spa: {
    title: 'Spa / Salon Receptionist',
    description: `Provide front desk support for a nail salon or beauty spa. Manage bookings, greet clients, and ensure a relaxing atmosphere.

Duties:
• Answer phones and schedule appointments
• Greet clients and offer beverages or magazines
• Process payments and handle retail product sales
• Maintain cleanliness of reception and waiting areas
• Assist with inventory and supply ordering`,
  },

  cleaning_services: {
    title: 'Cleaning Specialist',
    description: `Provide professional cleaning services for residential or commercial properties. Ensure thorough and detail-oriented work.

Duties:
• Clean and sanitize rooms, bathrooms, and common areas
• Vacuum, mop, and dust all surfaces
• Empty trash and replace liners
• Restock cleaning supplies and toiletries
• Follow safety protocols and use proper equipment`,
  },

  event_staffing: {
    title: 'Event Staff / Server',
    description: `Support event setup, service, and breakdown for weddings, corporate events, and parties. Provide excellent guest service.

Duties:
• Set up tables, chairs, and event decor
• Serve food and beverages to guests
• Clear tables and maintain cleanliness during events
• Assist with event breakdown and cleanup
• Follow event coordinator instructions and timelines`,
  },

  childcare_daycare: {
    title: 'Childcare Assistant / Daycare Aide',
    description: `Assist with the care and supervision of children in a daycare or childcare setting. Support educational activities and maintain a safe environment.

Duties:
• Supervise children during play and learning activities
• Assist with meals, snacks, and nap time
• Help with diaper changes and bathroom needs
• Maintain cleanliness and organize toys/materials
• Follow safety protocols and report concerns to lead teacher`,
  },

  senior_care: {
    title: 'Senior Care Assistant / Caregiver',
    description: `Provide compassionate care and support to seniors in assisted living or home care settings. Assist with daily activities and companionship.

Duties:
• Assist with daily living activities (bathing, dressing, grooming)
• Help with meal preparation and feeding
• Provide medication reminders as directed
• Offer companionship and engage in activities
• Monitor and report changes in health or behavior`,
  },

  hospitality: {
    title: 'Hotel / Motel Front Desk Associate',
    description: `Provide guest services at hotel or motel front desk. Handle check-ins, reservations, and guest inquiries with professionalism.

Duties:
• Check guests in and out, process payments
• Answer phones and manage reservations
• Provide information about hotel amenities and local attractions
• Handle guest complaints and resolve issues
• Maintain lobby cleanliness and restock brochures`,
  },

  construction: {
    title: 'Construction Laborer / Handyman',
    description: `Assist with construction projects, repairs, and general maintenance work. Perform hands-on tasks and support skilled tradespeople.

Duties:
• Assist with site preparation and cleanup
• Load and unload materials and equipment
• Perform basic carpentry, painting, or repair tasks
• Follow safety protocols and wear protective equipment
• Take direction from contractors and project managers`,
  },

  landscaping: {
    title: 'Landscaping / Lawn Care Worker',
    description: `Maintain outdoor spaces through mowing, trimming, planting, and general landscaping duties. Work outdoors in various weather conditions.

Duties:
• Mow lawns and trim edges
• Plant flowers, shrubs, and trees
• Weed garden beds and apply mulch
• Operate landscaping equipment safely
• Clean up debris and maintain tools`,
  },

  moving_storage: {
    title: 'Moving / Warehouse Helper',
    description: `Assist with moving household or commercial goods. Load, transport, and unload items safely and efficiently.

Duties:
• Load and unload trucks with furniture and boxes
• Wrap and protect items during transport
• Carry items up and down stairs
• Assist with packing and organizing storage units
• Follow safety protocols and prevent damage`,
  },

  car_wash_detailing: {
    title: 'Car Wash / Detailing Technician',
    description: `Clean and detail vehicles to a high standard. Perform exterior washing, interior cleaning, and finishing touches.

Duties:
• Wash and dry vehicle exteriors
• Vacuum and clean vehicle interiors
• Apply wax, polish, and tire shine
• Clean windows, mirrors, and dashboards
• Maintain equipment and supply inventory`,
  },

  security_services: {
    title: 'Security Guard / Officer',
    description: `Provide security and safety services for properties, events, or facilities. Monitor premises and respond to incidents.

Duties:
• Patrol assigned areas and monitor surveillance systems
• Check credentials and control access to facilities
• Respond to alarms and security incidents
• Write reports and document incidents
• Provide customer service and assist visitors`,
  },

  other: {
    title: 'General Worker',
    description: `Perform flexible duties depending on business needs. Tasks may vary across industries.

Duties:
• Support general business operations
• Perform customer service or support tasks
• Help with setup, cleaning, or stocking
• Follow instructions from supervisors
• Maintain workplace safety and professionalism`,
  },
};

/**
 * Get job description template by business type
 * @param businessType - The type of business (e.g., 'restaurant', 'retail_store')
 * @returns JobDescriptionTemplate or undefined if not found
 */
export function getJobDescriptionTemplate(businessType: string): JobDescriptionTemplate | undefined {
  return JOB_DESCRIPTION_TEMPLATES[businessType];
}

