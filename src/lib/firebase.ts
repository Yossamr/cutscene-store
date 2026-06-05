
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfig from "../../firebase-applet-config.json";

/**
 * Cutscene Firebase Initialization
 * This setup uses the Firebase v10 Modular SDK.
 * Vite will bundle this for static hosting on GitHub Pages.
 */

// 1. Initialize Firebase
let appInstance: ReturnType<typeof initializeApp> | undefined;
export let db: any = null; // Using any to avoid type complexity when null
export let analytics: any = null;

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("remixed-api-key");

if (!isPlaceholder) {
  try {
    appInstance = initializeApp(firebaseConfig);
    db = getFirestore(appInstance);
    
    isSupported().then((supported) => {
      if (supported && appInstance) {
        analytics = getAnalytics(appInstance);
      }
    }).catch((err) => {
      console.warn("Analytics not supported or failed to initialize", err);
    });
  } catch (error) {
    console.error("Firebase initialization error. Please check your firebase-applet-config.json credentials:", error);
  }
} else {
  console.info("Firebase is in placeholder mode. Setup Firebase to enable database and analytics features.");
}


/**
 * 3. Function to add a test product to "products" collection
 * This verifies the database connection is working.
 */
export async function addTestProduct() {
  if (!db) {
    console.warn("Firestore not initialized (placeholder mode). Skipping test product addition.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "products"), {
      name: "Dexter 'Dark Passenger' Hoodie",
      price: 45.99,
      category: "Hoodies",
      theme: "Dexter",
      description: "A premium hoodie inspired by the iconic series.",
      createdAt: new Date().toISOString()
    });
    console.log("âœ… Test product added with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("â Œ Error adding document:", e);
    throw e;
  }
}

/**
 * 4. Function to fetch all products from "products" collection
 * Prints them to the console as requested.
 */
export async function fetchAllProducts() {
  if (!db) {
    console.warn("Firestore not initialized (placeholder mode). Skipping product fetch.");
    return [];
  }
  try {
    console.log("ðŸ“¦ Fetching products from Firestore...");
    const querySnapshot = await getDocs(collection(db, "products"));
    const products: any[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("âœ… Successfully fetched products:", products);
    return products;
  } catch (e) {
    console.error("â Œ Error fetching products:", e);
    throw e;
  }
}
