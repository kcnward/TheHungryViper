import "./style.css";
import {
  getDefaultSession,
  handleIncomingRedirect,
  login,
} from "@inrupt/solid-client-authn-browser";
import {
  buildThing,
  createThing,
  createSolidDataset,
  getSolidDataset,
  getThing,
  getUrl,
  saveSolidDatasetAt,
  setThing,
} from "@inrupt/solid-client";
import { RDF, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf";

const PIM_STORAGE = "http://www.w3.org/ns/pim/space#storage";
const FOLDER = "hungry-viper-waitlist/";

const OIDC_ISSUER = "https://solidcommunity.net";

const session = getDefaultSession();

function getRedirectUrl(): string {
  return new URL(".", window.location.href).href;
}

function el<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function setStatus(msg: string) {
  const s = el("p#status");
  if (s) s.textContent = msg;
}

function normalizeStorageRoot(href: string | null | undefined): string | null {
  if (!href) return null;
  return href.endsWith("/") ? href : `${href}/`;
}

async function getStorageFromWebId(): Promise<string | null> {
  const webId = session.info.webId;
  if (!webId) return null;
  const card = await getSolidDataset(webId, { fetch: session.fetch });
  const me = getThing(card, webId);
  if (!me) return null;
  return normalizeStorageRoot(getUrl(me, PIM_STORAGE));
}

function buildEntryDataset(
  fileUrl: string,
  name: string,
  email: string,
  note: string,
) {
  const entryIri = `${fileUrl}#entry`;
  let builder = buildThing(createThing({ url: entryIri }))
    .addIri(RDF.type, SCHEMA_INRUPT.Person)
    .addStringNoLocale(SCHEMA_INRUPT.name, name)
    .addStringNoLocale(SCHEMA_INRUPT.email, email);
  if (note.trim() !== "")
    builder = builder.addStringNoLocale(SCHEMA_INRUPT.description, note);
  return setThing(createSolidDataset(), builder.build());
}

async function saveWaitlistEntry(
  storageRoot: string,
  name: string,
  email: string,
  note: string,
) {
  const fileUrl = new URL(
    `${FOLDER}entry-${Date.now()}.ttl`,
    storageRoot,
  ).href;
  const dataset = buildEntryDataset(fileUrl, name, email, note);
  await saveSolidDatasetAt(fileUrl, dataset, { fetch: session.fetch });
}

function updateUi() {
  const loggedIn = session.info.isLoggedIn;
  const line = el("p#sessionLine");
  const form = el("form#waitlistForm");
  const loginBtn = el("button#btnLogin");
  const outBtn = el("button#btnLogout");

  if (line) {
    if (loggedIn)
      line.textContent = session.info.webId
        ? `Signed in: ${session.info.webId}`
        : "Signed in";
    else line.textContent = "Not signed in. Use your Solid Community account.";
  }
  if (form) form.hidden = !loggedIn;
  if (loginBtn) loginBtn.hidden = loggedIn;
  if (outBtn) outBtn.hidden = !loggedIn;
}

void (async function init() {
  await handleIncomingRedirect({
    url: window.location.href,
    restorePreviousSession: true,
  });
  updateUi();

  session.events.on("login", () => {
    setStatus("Signed in.");
    updateUi();
  });
  session.events.on("logout", () => {
    setStatus("Signed out.");
    updateUi();
  });

  el("button#btnLogin")?.addEventListener("click", () => {
    setStatus("Opening your Solid provider…");
    void login({
      oidcIssuer: OIDC_ISSUER,
      redirectUrl: getRedirectUrl(),
      clientName: "The Hungry Viper",
    });
  });

  el("button#btnLogout")?.addEventListener("click", () => {
    void session.logout();
  });

  el("form#waitlistForm")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const note = String(fd.get("note") ?? "");
    if (!name || !email) {
      setStatus("Please enter your name and email.");
      return;
    }
    void (async () => {
      setStatus("Saving to your pod…");
      try {
        const root = await getStorageFromWebId();
        if (!root) {
          setStatus("Could not read storage from your WebID (pim:storage).");
          return;
        }
        await saveWaitlistEntry(root, name, email, note);
        setStatus("Saved. Check your pod folder “hungry-viper-waitlist”.");
        form.reset();
      } catch (e) {
        const err = e as Error;
        setStatus(
          `Error: ${err.message ?? "Could not save. Check permissions to create files in your pod."}`,
        );
      }
    })();
  });
})();
