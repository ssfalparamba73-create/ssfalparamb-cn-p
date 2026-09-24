const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The right column wrapper
const oldRightCol = `<div className="relative z-10 hidden lg:flex items-center justify-center pt-8 pb-0 px-20 w-full">`;
// Add pt-24 so it clears the fixed header on desktop
const newRightCol = `<div className="relative z-10 hidden lg:flex items-center justify-center pt-24 pb-8 px-20 w-full">`;

if (content.includes(oldRightCol)) {
  content = content.replace(oldRightCol, newRightCol);
  fs.writeFileSync(file, content);
  console.log('Fixed right column overlap');
} else {
  console.log('Could not find right col');
}
