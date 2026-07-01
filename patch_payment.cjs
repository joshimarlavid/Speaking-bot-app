const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const paypalFunction = `
  const handlePayment = () => {
    // In a real app, this redirects to PayPal or opens a checkout modal.
    window.open("https://paypal.me/YOUR_PAYPAL_LINK", "_blank");
    setIsPremium(true);
    localStorage.setItem('linguaRole_premium', 'true');
  };
`;

content = content.replace(
  /const rollDice = \(\) => {/,
  `${paypalFunction}\n\n  const rollDice = () => {`
);

content = content.replace(
  /onClick=\{\(\) => setIsPremium\(true\)\}/g,
  `onClick={handlePayment}`
);

fs.writeFileSync(appFile, content);
console.log("Payment flow patched.");
