/* ── Bifröst Theme — Early Init (kein defer, kein FOUC) ───── */
(function () {
	const $saved = localStorage.getItem('bifrost-theme');
	if ($saved === 'dark' || $saved === 'light') {
		document.documentElement.setAttribute('data-theme', $saved);
	}
}());
