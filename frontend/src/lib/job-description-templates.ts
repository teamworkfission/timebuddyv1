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
    title: 'Liquor Store Clerk / Cashier',
    description: `Assist customers with purchases of beer, wine, and spirits while ensuring ID verification and compliance with state laws.

Duties:
• Greet and assist customers
• Check IDs and enforce age restrictions
• Operate register and handle payments
• Stock shelves and coolers
• Maintain a clean, orderly store`,
  },

  smoke_vape_shop: {
    title: 'Vape Shop Associate',
    description: `Provide customer service and sales support in a smoke and vape shop, ensuring compliance with age restrictions.

Duties:
• Greet customers and answer product questions
• Verify customer ID for tobacco/vape sales
• Restock products and maintain displays
• Operate POS system and process sales
• Keep store clean and organized`,
  },

  salon_barber: {
    title: 'Salon Assistant / Receptionist',
    description: `Support daily salon operations by assisting stylists, managing appointments, and welcoming clients.

Duties:
• Greet clients and manage scheduling
• Assist stylists with prep and cleanup
• Shampoo or blow-dry clients (if trained)
• Keep salon clean and stocked with supplies
• Handle payments and product sales`,
  },

  nail_beauty_spa: {
    title: 'Spa Receptionist / Assistant',
    description: `Assist spa professionals by greeting clients, maintaining a clean environment, and providing customer service.

Duties:
• Welcome guests and manage check-ins
• Support nail technicians or estheticians
• Clean and sanitize stations
• Restock spa products and supplies
• Answer calls and handle bookings`,
  },

  cleaning_services: {
    title: 'Cleaner / Janitorial Staff',
    description: `Perform cleaning duties in residential, office, or commercial spaces to ensure a safe and sanitary environment.

Duties:
• Sweep, mop, vacuum, and dust
• Sanitize restrooms and common areas
• Take out trash and recyclables
• Restock cleaning supplies
• Follow client or supervisor instructions`,
  },

  event_staffing: {
    title: 'Event Staff Member',
    description: `Provide guest support and operational assistance at events such as concerts, weddings, or conferences.

Duties:
• Greet and direct guests
• Assist with setup and teardown
• Serve food or beverages (if assigned)
• Monitor crowd and event safety
• Work ticketing, ushering, or registration desks`,
  },

  childcare_daycare: {
    title: 'Childcare Assistant',
    description: `Help with daily care and supervision of children in daycare or after-school settings.

Duties:
• Supervise children during play and activities
• Assist with meals, snacks, and clean-up
• Support teachers with classroom tasks
• Ensure safety and follow childcare policies
• Communicate with parents as needed`,
  },

  senior_care: {
    title: 'Care Aide / Support Staff',
    description: `Provide assistance and support to seniors in assisted living or residential care facilities.

Duties:
• Help residents with meals and mobility
• Provide companionship and conversation
• Assist with light housekeeping
• Support staff in daily operations
• Follow health and safety protocols`,
  },

  hospitality: {
    title: 'Hotel Associate',
    description: `Support hotel operations in front desk, housekeeping, or guest services roles.

Duties:
• Welcome and assist guests at check-in/out
• Clean and prepare guest rooms
• Assist with laundry and supplies
• Support banquet/events staff if needed
• Ensure guest satisfaction and safety`,
  },

  construction: {
    title: 'General Laborer',
    description: `Assist skilled workers and contractors with construction, repair, or maintenance projects.

Duties:
• Carry tools and materials
• Perform basic construction tasks
• Assist in cleanup and site prep
• Follow supervisor instructions
• Maintain safety on job site`,
  },

  landscaping: {
    title: 'Groundskeeper / Lawn Care Worker',
    description: `Maintain lawns, gardens, and outdoor spaces for residential or commercial clients.

Duties:
• Mow, trim, and edge lawns
• Plant and water greenery
• Rake leaves and clean outdoor areas
• Operate basic landscaping tools
• Follow safety practices outdoors`,
  },

  moving_storage: {
    title: 'Mover / Loader',
    description: `Assist in packing, loading, transporting, and unloading household or commercial items.

Duties:
• Pack items safely into boxes
• Load/unload trucks and vans
• Move furniture and equipment
• Handle items with care
• Follow supervisor's moving plan`,
  },

  car_wash_detailing: {
    title: 'Car Wash Attendant / Detailer',
    description: `Clean, wash, and detail customer vehicles for a professional finish.

Duties:
• Wash and dry vehicle exteriors
• Vacuum and clean interiors
• Apply wax or detailing products
• Handle cash and process payments
• Keep work area tidy and safe`,
  },

  security_services: {
    title: 'Security Guard / Event Security',
    description: `Maintain safety and order at events, venues, or businesses.

Duties:
• Monitor entry and exits
• Check IDs when required
• Patrol premises for safety
• Assist with crowd control
• Report any incidents or concerns`,
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

