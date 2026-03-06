const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
    });
    const page = await browser.newPage();

    page.on("console", (msg) => {
      console.log(`[CONSOLE] ${msg.type()}:`, msg.text());
    });

    page.on("pageerror", (err) => {
      console.log(`[PAGE_ERROR]:`, err.message);
    });

    await page.goto("https://civsetu-app-488924381458.asia-south1.run.app", {
      waitUntil: "networkidle0",
    });

    const title = await page.title();
    console.log(`[PAGE_TITLE]: ${title}`);

    const content = await page.evaluate(() => {
      const root = document.getElementById("root");
      return root ? root.innerHTML : "Root element not found";
    });
    console.log(`[ROOT_CONTENT_PREVIEW]: ${content.substring(0, 500)}...`);

    await browser.close();
  } catch (e) {
    console.error("Script Error:", e);
  }
})();
