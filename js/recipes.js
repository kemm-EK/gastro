const RecipesPage = {
  state: { list: [], filtered: [], filter: "all" },

  async init({ jsonPath, titleKey = "titel" }) {
    const grid = document.getElementById("recipeGrid");
    if (!grid) return;

    const list = await fetch(jsonPath)
      .then((r) => r.json())
      .catch(() => []);
    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML = `<div class="muted">Ingen opskrifter endnu.</div>`;
      return;
    }

    this.state.list = list;
    this.state.filtered = list;
    this.bindFilter();
    this.renderGrid(titleKey);

    grid.replaceChildren(...list.map((item, idx) => this.makeCard(item, idx, titleKey)));
    this.bindPopover();
  },

  makeCard(item, idx, titleKey) {
    const title = item?.[titleKey] || "Untitled";

    const time = item?.tid?.tilberedningMin || item?.tid?.totalMin || "";

    const portions = item?.portioner || "";

    const imgSrc = item?.billede || "";

    const card = document.createElement("button");
    card.type = "button";
    card.className = "tile recipe-tile";
    card.dataset.idx = String(idx);

    card.innerHTML = `
    <h2>${escapeHtml(title)}</h2>

    <div class="tile-image">
      ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(title)}">` : `<div class="tile-image-placeholder">Intet billede</div>`}
    </div>

    <p class="tile-meta">
      ${time ? `⏱ ${time} min` : ""}
      ${time && portions ? " &nbsp; " : ""}
      ${portions ? `👥 ${portions} pers` : ""}
    </p>
  `;

    card.addEventListener("click", () => this.openRecipe(idx));
    return card;
  },
  bindPopover() {
    this.pop = document.getElementById("recipePopover");
    this.popTitle = document.getElementById("popTitle");
    this.popDesc = document.getElementById("popDesc");
    this.popIngredients = document.getElementById("popIngredients");
    this.popSteps = document.getElementById("popSteps");
    this.popTipsWrap = document.getElementById("popTipsWrap");
    this.popTips = document.getElementById("popTips");
    this.popServingWrap = document.getElementById("popServingWrap");
    this.popServing = document.getElementById("popServing");
  },

  openRecipe(idx) {
    const item = this.state.list[idx];
    if (!item || !this.pop) return;

    this.popTitle.textContent = item.titel || "Untitled";

    const desc = item.beskrivelse || item.kort || item.note || "";
    this.popDesc.textContent = desc;
    this.popDesc.style.display = desc ? "" : "none";

    // ingredienser: accepterer både {mængde,enhed,ingrediens} og {mængde:"400 g", ingrediens:"..."}
    const ings = Array.isArray(item.ingredienser) ? item.ingredienser : [];
    this.popIngredients.replaceChildren(...ings.map(liFromIngredient));

    // fremgangsmåde: array af strings
    const steps = Array.isArray(item.fremgangsmåde) ? item.fremgangsmåde : [];
    this.popSteps.replaceChildren(
      ...steps.map((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        return li;
      }),
    );
    // serveringsforslag / tilbehør
    const serving = Array.isArray(item.servering) ? item.servering : [];
    if (this.popServingWrap && this.popServing) {
      if (serving.length === 0) {
        this.popServingWrap.style.display = "none";
        this.popServing.replaceChildren();
      } else {
        this.popServingWrap.style.display = "";
        this.popServing.replaceChildren(
          ...serving.map((line) => {
            const li = document.createElement("li");
            li.textContent = line;
            return li;
          }),
        );
      }
    }

    // show popover
    if (typeof this.pop.showPopover === "function") {
      this.pop.showPopover();
    } else {
      // fallback (hvis popover API mangler)
      this.pop.style.display = "block";
    }

    // Tips & teknikker (fold-ud)
    const tips = Array.isArray(item.tips) ? item.tips : [];
    if (this.popTipsWrap && this.popTips) {
      if (tips.length === 0) {
        this.popTipsWrap.style.display = "none";
        this.popTips.replaceChildren();
      } else {
        this.popTipsWrap.style.display = "";
        this.popTips.replaceChildren(...tips.map(renderTipDetails));
      }
    }
  },
  bindFilter() {
    const sel = document.getElementById("catFilter");
    if (!sel) return;

    sel.addEventListener("change", () => {
      this.state.filter = sel.value;
      this.applyFilter();
    });
  },

  applyFilter() {
    const f = this.state.filter;
    if (f === "all") {
      this.state.filtered = this.state.list;
    } else {
      this.state.filtered = this.state.list.filter((x) => (x.kategori || "").toLowerCase() === f);
    }
    this.renderGrid("titel");
  },

  renderGrid(titleKey = "titel") {
    const grid = document.getElementById("recipeGrid");
    if (!grid) return;

    const list = this.state.filtered || [];
    grid.replaceChildren(
      ...list.map((item, idx) => {
        // OBS: idx her er filtered-index, så vi gemmer original index til popover
        const originalIndex = this.state.list.indexOf(item);
        return this.makeCard(item, originalIndex, titleKey);
      }),
    );
  },
};

function liFromIngredient(row) {
  const li = document.createElement("li");

  const amount = row?.mængde;
  const unit = row?.enhed;
  const name = row?.ingrediens || row?.navn || "";

  let left = "";
  if (amount != null && amount !== "") left += String(amount);
  if (unit) left += (left ? " " : "") + String(unit);

  li.textContent = left ? `${left} – ${name}` : name;
  return li;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTipDetails(tip) {
  const details = document.createElement("details");
  details.className = "recipe-tip";

  const summary = document.createElement("summary");
  summary.textContent = tip.titel || "Tip";
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "tip-body";

  if (tip.intro) {
    const p = document.createElement("p");
    p.textContent = tip.intro;
    body.appendChild(p);
  }

  const sections = Array.isArray(tip.sektioner) ? tip.sektioner : [];
  sections.forEach((sec) => {
    if (sec.overskrift) {
      const h4 = document.createElement("h4");
      h4.textContent = sec.overskrift;
      body.appendChild(h4);
    }

    const items = Array.isArray(sec.punkter) ? sec.punkter : [];
    if (items.length) {
      const ul = document.createElement("ul");
      items.forEach((txt) => {
        const li = document.createElement("li");
        li.textContent = txt;
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }
  });

  details.appendChild(body);
  return details;
}
