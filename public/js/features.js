/* ============================================================
   Bifröst Features/Docs — Seiten-spezifisches JS
   Scroll-Spy + Smooth-Scroll für Sidebar-Navigation
   ============================================================ */

/* ── Scroll-Spy ──────────────────────────────────────────── */
const $sections = document.querySelectorAll('.docs-section');
const $navLinks = document.querySelectorAll('.docs-nav a[href^="#"]');

if ($sections.length && $navLinks.length) {
	const spy = new IntersectionObserver(($entries) => {
		$entries.forEach(($e) => {
			if (!$e.isIntersecting) return;
			$navLinks.forEach($l => $l.closest('li')?.classList.remove('active'));
			document.querySelector(`.docs-nav a[href="#${$e.target.id}"]`)
				?.closest('li')?.classList.add('active');
		});
	}, { rootMargin: '-15% 0px -75% 0px' });
	$sections.forEach($s => spy.observe($s));

	/* ── Smooth-Scroll ── */
	$navLinks.forEach(($a) => {
		$a.addEventListener('click', ($e) => {
			$e.preventDefault();
			document.querySelector($a.getAttribute('href'))
				?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
}
