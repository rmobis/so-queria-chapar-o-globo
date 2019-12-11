const puppeteer = require('puppeteer'),
	ntf = require('node-notifier');

function pptrNewCommentListener(cmt) {
	console.log(cmt);

	cmt = cmt.toLowerCase();

	if (cmt.includes('vend')) {
		ntf.notify({
			title: 'TROXA VENDENDO INGRESSO',
			message: 'corre lá pra comprar e ser menos troxa'
		});
	}
}

async function login(page, user, pass) {
	await page.goto('https://fb.com', { waitUntil: 'networkidle2' });
	await page.waitForSelector('#email');
	await page.type('#email', user);
	await page.type('#pass', pass);
	await page.waitFor(500);
	await page.click('#loginbutton');
	await page.waitForNavigation();
}

async function watchForSale(page) {
	await page.goto('https://www.facebook.com/events/420898741949454/permalink/446141999425128', { waitUntil: 'networkidle2' });

	page.exposeFunction('pptrNewCommentListener', pptrNewCommentListener);

	await page.evaluate(() => {
		const target = document.querySelector('#pagelet_pinned_posts .commentable_item ul');
		const observer = new MutationObserver((mutations) => {
			console.log(mutations);

			for (const m of mutations) {
				console.log(m);
				for (const n of [...m.addedNodes]) {
					const textNodes = n.querySelectorAll('[data-testid="UFI2Comment/body"] span > span > span');

					for (const t of [...textNodes]) {
						window.pptrNewCommentListener(t.textContent);
					}
				}
			}
		});

		observer.observe(target, { childList: true });
	});
}

const user = process.argv[2];
const pass = process.argv[3];

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		//slowMo: 25,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	const context = browser.defaultBrowserContext();
	const [page] = await browser.pages();

	await page.setBypassCSP(true);
	await page.setViewport({
		width: 1920,
		height: 1080,
		deviceScaleFactor: 1,
	});

	context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

	await login(page, user, pass);
	await watchForSale(page);
})();
