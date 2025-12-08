// Type declarations for CSS modules
declare module "*.css" {
  const content: any;
  export default content;
}

// Specific declaration for globals.css side-effect import
declare module "./globals.css";
