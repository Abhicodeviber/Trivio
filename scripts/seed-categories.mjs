import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/servehub';

const FieldDefSchema = new mongoose.Schema(
  { name: String, label: String, type: String, placeholder: String, options: [String], unit: String, required: Boolean },
  { _id: false }
);
const CategorySchema = new mongoose.Schema(
  { name: String, slug: String, icon: String, description: String, fields: [FieldDefSchema], isActive: { type: Boolean, default: true } },
  { timestamps: true }
);
const Category = mongoose.models.Category ?? mongoose.model('Category', CategorySchema);

const CATEGORIES = [
  {
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    icon: '🧹',
    description: 'Professional home and office cleaning services',
    fields: [
      { name: 'cleaningType',      label: 'Cleaning Type',      type: 'select',   options: ['Deep Clean','Regular Cleaning','Move-in/Out','Post-Construction','Office Cleaning'], required: true },
      { name: 'propertySize',      label: 'Property Size',       type: 'select',   options: ['Studio','1 BHK','2 BHK','3 BHK','4 BHK+','Office Space'], required: true },
      { name: 'suppliesIncluded',  label: 'Supplies Included',   type: 'checkbox' },
      { name: 'petsInHome',        label: 'Pet-Friendly',        type: 'checkbox' },
      { name: 'frequency',         label: 'Service Frequency',   type: 'select',   options: ['One-time','Weekly','Bi-weekly','Monthly'] },
    ],
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    icon: '🔧',
    description: 'Pipe repair, drain cleaning, installations and more',
    fields: [
      { name: 'serviceType',    label: 'Service Type',       type: 'select',   options: ['Pipe Repair','Leak Fix','Drain Cleaning','Water Heater','Toilet Repair','Installation','General Inspection'], required: true },
      { name: 'emergency',      label: '24/7 Emergency Available', type: 'checkbox' },
      { name: 'warrantyDays',   label: 'Warranty (days)',    type: 'number',   unit: 'days',  placeholder: '30' },
      { name: 'experience',     label: 'Years of Experience', type: 'number',  unit: 'yrs',  placeholder: '5', required: true },
    ],
  },
  {
    name: 'Electrical',
    slug: 'electrical',
    icon: '⚡',
    description: 'Wiring, installations, panel upgrades and electrical repairs',
    fields: [
      { name: 'serviceType',  label: 'Service Type',    type: 'select',  options: ['Wiring','Panel Upgrade','Outlet Installation','Lighting','Ceiling Fan','Generator','Safety Inspection'], required: true },
      { name: 'licensed',     label: 'Licensed Electrician', type: 'checkbox', required: true },
      { name: 'emergency',    label: '24/7 Emergency Available', type: 'checkbox' },
      { name: 'warrantyDays', label: 'Warranty (days)', type: 'number', unit: 'days', placeholder: '90' },
    ],
  },
  {
    name: 'Graphic Design',
    slug: 'graphic-design',
    icon: '🎨',
    description: 'Logos, brochures, social media graphics and more',
    fields: [
      { name: 'designType',   label: 'Design Type',     type: 'select',   options: ['Logo & Branding','Social Media Graphics','Brochure / Flyer','Banner / Poster','UI/UX Design','Illustration','Infographic'], required: true },
      { name: 'fileFormats',  label: 'File Formats',    type: 'text',     placeholder: 'e.g. PDF, AI, PNG, SVG' },
      { name: 'revisions',    label: 'Revisions Included', type: 'number', unit: 'rounds', placeholder: '3', required: true },
      { name: 'turnaround',   label: 'Turnaround Time', type: 'select',  options: ['24 hours','2–3 days','1 week','2 weeks','Custom'] },
      { name: 'sourceFiles',  label: 'Source Files Included', type: 'checkbox' },
    ],
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    icon: '💻',
    description: 'Websites, web apps, APIs and full-stack development',
    fields: [
      { name: 'projectType',  label: 'Project Type',    type: 'select',  options: ['Landing Page','Business Website','E-commerce','Portfolio','Web App','API / Backend','Maintenance'], required: true },
      { name: 'techStack',    label: 'Tech Stack',      type: 'text',    placeholder: 'e.g. React, Node.js, MongoDB', required: true },
      { name: 'timeline',     label: 'Timeline',        type: 'select',  options: ['< 1 week','1–2 weeks','1 month','2–3 months','Ongoing'] },
      { name: 'hostingSetup', label: 'Hosting & Deployment Included', type: 'checkbox' },
      { name: 'cmsIncluded',  label: 'CMS / Admin Panel Included',   type: 'checkbox' },
    ],
  },
  {
    name: 'Tutoring',
    slug: 'tutoring',
    icon: '📚',
    description: 'Academic tutoring, test prep and skill coaching',
    fields: [
      { name: 'subject',         label: 'Subject',            type: 'select',  options: ['Mathematics','Physics','Chemistry','Biology','English','History','Computer Science','Languages','Test Prep (SAT/ACT)','Other'], required: true },
      { name: 'level',           label: 'Student Level',      type: 'select',  options: ['Elementary','Middle School','High School','College','Adult Learner'], required: true },
      { name: 'sessionDuration', label: 'Session Duration',   type: 'select',  options: ['30 min','45 min','60 min','90 min','2 hours'] },
      { name: 'onlineAvailable', label: 'Online Sessions Available', type: 'checkbox' },
      { name: 'homeworkHelp',    label: 'Homework Help Included',    type: 'checkbox' },
    ],
  },
  {
    name: 'Photography',
    slug: 'photography',
    icon: '📷',
    description: 'Portrait, event, product and real estate photography',
    fields: [
      { name: 'shootType',       label: 'Shoot Type',          type: 'select',  options: ['Portrait','Wedding','Corporate Events','Product','Real Estate','Newborn/Family','Nature/Travel'], required: true },
      { name: 'shootDuration',   label: 'Session Duration',    type: 'select',  options: ['1 hour','2 hours','Half day (4 hrs)','Full day (8 hrs)'], required: true },
      { name: 'editedPhotos',    label: 'Edited Photos Included', type: 'number', unit: 'photos', placeholder: '30', required: true },
      { name: 'rawFilesIncluded',label: 'RAW Files Included',  type: 'checkbox' },
      { name: 'onlineGallery',   label: 'Online Gallery Delivery', type: 'checkbox' },
    ],
  },
  {
    name: 'Moving & Delivery',
    slug: 'moving-delivery',
    icon: '🚚',
    description: 'Home moving, furniture delivery and packing services',
    fields: [
      { name: 'vehicleType',    label: 'Vehicle Type',    type: 'select',  options: ['Bike / Scooter','Car / SUV','Mini Van','Large Van','Small Truck','Large Truck'], required: true },
      { name: 'helpers',        label: 'Helpers Included', type: 'number', unit: 'people', placeholder: '2' },
      { name: 'maxDistance',    label: 'Max Distance',    type: 'number', unit: 'km',    placeholder: '50' },
      { name: 'packingService', label: 'Packing Service Included', type: 'checkbox' },
      { name: 'furnitureAssembly', label: 'Furniture Assembly Included', type: 'checkbox' },
    ],
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      await Category.findByIdAndUpdate(existing._id, cat);
      console.log(`↻  Updated  : ${cat.icon} ${cat.name}`);
    } else {
      await Category.create(cat);
      console.log(`✓  Created  : ${cat.icon} ${cat.name}`);
    }
  }

  console.log(`\n✅ ${CATEGORIES.length} categories ready.`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
