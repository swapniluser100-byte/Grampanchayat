/*
 * ग्रामपंचायत अर्जुनी — सुरुवातीची कॉन्फिगरेशन
 * फक्त grampanchayatarjuni.in वरून खात्री केलेली माहिती भरली आहे.
 * TODO असलेली माहिती ग्रामपंचायतीकडून घेऊन भरा. रिकामे विभाग आपोआप लपतात.
 * पूर्ण उदाहरणासाठी configs/demo.js पाहा.
 */
window.GP_CONFIG = {
  site: {
    name: "ग्रामपंचायत अर्जुनी",
    village: "अर्जुनी",
    taluka: "",          // TODO
    district: "",        // TODO
    state: "महाराष्ट्र",
    tagline: "",         // TODO
    logo: "",
    established: "",     // TODO
    lgdCode: "",         // TODO
    lastUpdated: "2026-10-03",
    demo: false
  },
  theme: { brand: "#0f5a46", accent: "#c27a0e", numerals: "devanagari" },
  contact: {
    phone: "7588249319",
    mobile: "",
    whatsapp: "917588249319",   // TODO: WhatsApp चालू आहे का खात्री करा
    email: "",                  // TODO
    address: "",                // TODO
    officeHours: "सकाळी ०९:४५ ते संध्याकाळी ६:१५",
    holidays: "",
    mapLink: "",
    mapEmbed: ""
  },
  hero: {
    image: "",
    welcome: "आपले स्वागत आहे",
    text: "ग्रामपंचायतीच्या सेवा, योजना, विकासकामे आणि सूचना एका ठिकाणी.",
    buttons: [{ label: "संपर्क", href: "#contact" }, { label: "तक्रार नोंदवा", href: "#grievance" }]
  },
  gramSabha: null,
  announcements: [],
  leaders: [
    { name: "श्री. बापू रामा यादव", role: "सरपंच", photo: "", phone: "" },
    { name: "श्री. सुदाम देसाई", role: "उपसरपंच", photo: "", phone: "" },
    { name: "श्री. प्रविणसिंह सुळकूडे", role: "ग्रामपंचायत अधिकारी", photo: "", phone: "" }
  ],
  message: null,
  stats: [
    { label: "लोकसंख्या", value: 1760, icon: "users" },
    { label: "प्रभाग", value: 3, icon: "grid" }
  ],
  about: { history: [], vision: "", goals: [], facilities: [] },
  services: [],
  schemes: [],
  works: [],
  budget: null,
  documents: [],
  committees: [],
  wardMembers: [],
  gallery: [],
  grievance: {
    mode: "whatsapp",
    formUrl: "",
    categories: ["पाणीपुरवठा", "रस्ते", "पथदिवे", "स्वच्छता / गटार", "दाखले", "इतर"],
    escalation: [
      { level: "स्तर १", who: "ग्रामपंचायत अधिकारी", days: "७ दिवस" },
      { level: "स्तर २", who: "सरपंच", days: "१५ दिवस" },
      { level: "स्तर ३", who: "गट विकास अधिकारी, पंचायत समिती", days: "३० दिवस" }
    ]
  },
  links: [
    { label: "आपले सरकार", href: "https://aaplesarkar.mahaonline.gov.in/" },
    { label: "ई-ग्रामस्वराज", href: "https://egramswaraj.gov.in/" },
    { label: "महाभूमी (७/१२)", href: "https://mahabhumi.gov.in/" },
    { label: "मनरेगा", href: "https://nrega.nic.in/" }
  ],
  social: {},
  sections: [
    { id: "about", label: "आमच्याबद्दल" },
    { id: "services", label: "नागरिक सेवा" },
    { id: "schemes", label: "योजना" },
    { id: "works", label: "विकासकामे" },
    { id: "budget", label: "अर्थसंकल्प" },
    { id: "documents", label: "सूचना व दस्तऐवज" },
    { id: "committees", label: "समित्या" },
    { id: "gallery", label: "छायाचित्रे" },
    { id: "grievance", label: "तक्रार" },
    { id: "contact", label: "संपर्क" }
  ],
  footer: { credit: "" }
};
