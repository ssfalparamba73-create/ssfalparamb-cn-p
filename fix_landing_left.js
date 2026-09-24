const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldLeftCol = `<div className="relative z-10 flex flex-col justify-center overflow-hidden px-4 py-6 md:px-12 lg:px-20 md:py-16 text-center md:text-left items-center md:items-start">`;
const newLeftCol = `<div className="relative z-10 flex flex-col justify-center overflow-hidden px-4 pt-24 pb-6 md:px-12 lg:px-20 md:pt-32 md:pb-16 text-center md:text-left items-center md:items-start">`;

if (content.includes(oldLeftCol)) {
  content = content.replace(oldLeftCol, newLeftCol);
  fs.writeFileSync(file, content);
  console.log('Fixed left column padding');
} else {
  console.log('Could not find left col');
}
