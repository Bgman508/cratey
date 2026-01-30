/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ArtistSignup from './pages/ArtistSignup';
import ArtistStorefront from './pages/ArtistStorefront';
import Artists from './pages/Artists';
import Dashboard from './pages/Dashboard';
import DashboardNewProduct from './pages/DashboardNewProduct';
import DashboardOrders from './pages/DashboardOrders';
import DashboardPayouts from './pages/DashboardPayouts';
import DashboardProducts from './pages/DashboardProducts';
import DashboardSettings from './pages/DashboardSettings';
import Home from './pages/Home';
import Library from './pages/Library';
import LibraryAccess from './pages/LibraryAccess';
import ProductPage from './pages/ProductPage';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardStripe from './pages/DashboardStripe';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ArtistSignup": ArtistSignup,
    "ArtistStorefront": ArtistStorefront,
    "Artists": Artists,
    "Dashboard": Dashboard,
    "DashboardNewProduct": DashboardNewProduct,
    "DashboardOrders": DashboardOrders,
    "DashboardPayouts": DashboardPayouts,
    "DashboardProducts": DashboardProducts,
    "DashboardSettings": DashboardSettings,
    "Home": Home,
    "Library": Library,
    "LibraryAccess": LibraryAccess,
    "ProductPage": ProductPage,
    "DashboardAnalytics": DashboardAnalytics,
    "DashboardStripe": DashboardStripe,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};