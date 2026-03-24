// ── LangSwitch ─────────────────────────────────────────────────────────────
const langswitch = document.getElementById('langswitch');
const lsToggle   = document.getElementById('langswitchToggle');

lsToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    langswitch.classList.toggle('langswitch--open');
    lsToggle.setAttribute('aria-expanded',
        langswitch.classList.contains('langswitch--open'));
});

document.addEventListener('click', () => {
    langswitch?.classList.remove('langswitch--open');
    lsToggle?.setAttribute('aria-expanded', 'false');
});
