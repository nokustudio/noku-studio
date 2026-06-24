(function () {
  var M = {
    wood: [
      { id: "teak", name: "Teak", subtitle: "Tectona grandis", cls: "swatch-wood-teak", preview: "Resources/material images/Wood/Teak.png", desc: "Renowned for its rich golden to medium brown hues that deepen with age, teak's straight grain and coarse texture exude timeless elegance. Naturally resistant to water, rot, and pests, its durability ensures lasting beauty with minimal upkeep." },
      { id: "honne", name: "Honne", subtitle: "Intsia bijuga", cls: "swatch-wood-honne", preview: "Resources/material images/Wood/Honne.png", desc: "Characterized by rich, golden to reddish-brown color, which deepens over time, adding warmth and character. Its straight, fine grain makes it ideal for furniture, flooring, and cabinetry. Notably resistant to decay, termites, and fungal attacks." },
      { id: "matti", name: "Matti", subtitle: "Terminalia elliptica", cls: "swatch-wood-matti", preview: "Resources/material images/Wood/Bhilwara.png", desc: "Also known as Indian Laurel, this hardwood ranges in colour from deep brown to almost black, with a grain reminiscent of walnut. Dense and heavy, it offers exceptional strength and durability." },
      { id: "pinewood", name: "Pinewood", subtitle: "Pinus spp", cls: "", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b5e5a5bcc3b3b458a_67c94441373cbaa21b613a32_Pine%2520wood%2520texture.jpeg", desc: "A pale yellow to light brown softwood with a straight to slightly wavy grain and medium-to-coarse texture. Easy to work with and sturdy, ideal for carpentry and joinery." }
    ],
    leather: [
      { id: "glory-honey", name: "Glory Honey", subtitle: "Premium Hide", cls: "swatch-leather-glory-honey", preview: "Resources/material images/Leather/Glory Honey.jpeg", desc: "A celebration of nature's glorious irregularities. This naked hide becomes your lifelong canvas, absorbing every encounter and moulded by each touch as you leave a distinct mark." },
      { id: "vagabond-cognac", name: "Vagabond Cognac", subtitle: "Full-Grain Leather", cls: "swatch-leather-vagabond-cognac", preview: "Resources/material images/Leather/Vagabond Cognac.jpeg", desc: "A premium full-grain leather with rich, deep brown color and a luxurious feel. Its natural, uncorrected grain showcases the hide's unique textures with a smooth, supple touch and slight sheen." },
      { id: "montana-chestnut", name: "Montana Chestnut", subtitle: "Aniline Leather", cls: "swatch-leather-montana-chestnut", preview: "Resources/material images/Leather/Montana Chestnut.jpg", desc: "Only the most premium hides make for an aniline finish that retains natural textures and grain. Soaked in oils and well moisturized for a natural sheen, cushiony appearance, and supple feel." },
      { id: "emperor-brick", name: "Emperor Brick", subtitle: "Natural Grain Hide", cls: "swatch-leather-emperor-brick", preview: "Resources/material images/Leather/Emperor Brick.jpeg", desc: "A thick hide with good body in a completely natural grain. Plush and pleasing to the touch, the high drama of the grains commands attention while forgiving small incidents magnanimously." },
      { id: "eternity-olive", name: "Eternity Olive", subtitle: "Soft Pliable Hide", cls: "swatch-leather-eternity-olive", preview: "Resources/material images/Leather/Eternity Olive.jpeg", desc: "Soft and pliable hides that drape like a dream. A cloudy two-tone effect and deep earthy tones combine with natural sheen for shine and sophistication in any sleek setting." }
    ],
    fabric: [
      { id: "butter", name: "Butter", subtitle: "Easy-Clean Coating", cls: "swatch-fabric-butter", preview: "Resources/material images/Fabric/DDecor Comfort 3 Rustic Basketry Butter.jpg", desc: "Soft warm fabric with special easy-clean coating for high endurance, ideal for parents and pet-owners." },
      { id: "blush", name: "Blush", subtitle: "Herringbone Pattern", cls: "swatch-fabric-blush", preview: "Resources/material images/Fabric/Blush.jpeg", desc: "Muted fabric with a subtle Herringbone pattern that adds visual texture to your cushions." },
      { id: "rosebud", name: "Rosebud", subtitle: "Classic Indoor Fabric", cls: "swatch-fabric-rosebud", preview: "Resources/material images/Fabric/Rosebud.png", desc: "Casual yet classic, Rosebud is versatile as an indoor fabric, great for interiors with a muted colour palette." },
      { id: "rubik-linen", name: "Rubik Linen", subtitle: "Textured Linen", cls: "swatch-fabric-rubik-linen", preview: "Resources/material images/Fabric/Rubik Linen.jpg", desc: "Textured and soft fabric for bright interiors; contrasts well with our wood options." },
      { id: "silver", name: "Silver", subtitle: "Herringbone Velvet Finish", cls: "swatch-fabric-silver", preview: "Resources/material images/Fabric/Silver.jpeg", desc: "Classy and understated fabric with a subtle Herringbone pattern and velvet-like finish." },
      { id: "cloud", name: "Cloud", subtitle: "Reserved Grey Linen", cls: "swatch-fabric-cloud", preview: "Resources/material images/Fabric/Cloud.jpg", desc: "Linen option with a reserved grey finish to match any and every interiors palette." },
      { id: "opal", name: "Opal", subtitle: "Bold Hue Fabric", cls: "swatch-fabric-opal", preview: "Resources/material images/Fabric/Opal.png", desc: "Bright and bold hue perfect for adding invigorating pops of colour to furniture and cushions." },
      { id: "vienna", name: "Vienna", subtitle: "Understated Opulence Velvet", cls: "swatch-fabric-vienna", preview: "Resources/material images/Fabric/Vienna Army.jpg", desc: "Ideal for upholstery with understated opulence; a soft, velvety touch adding subtle luminosity to living spaces." },
      { id: "flute", name: "Flute", subtitle: "Deep Navy Striped Fabric", cls: "swatch-fabric-flute", preview: "Resources/material images/Fabric/Flute.jpeg", desc: "Striking lines in deep navy to add a vibrant texture to the furniture and space." },
      { id: "charcoal", name: "Charcoal", subtitle: "Plush Chenille Yarn", cls: "swatch-fabric-charcoal", preview: "Resources/material images/Fabric/Charcoal.png", desc: "Its chenille yarn offers a plush, multi-tonal finish, perfect for upholstery such as sofas or chairs." }
    ],
    cane: [
      { id: "woven-cane", name: "Woven Cane", subtitle: "Natural Rattan Vine", cls: "swatch-cane-woven-cane", preview: "Resources/material images/Cane/Woven cane.png", desc: "Crafted from rattan vine, woven cane brings light and airy beauty with warm tones and surprising durability. Lightweight, breathable, and low-maintenance." }
    ],
    metals: [
      { id: "brass", name: "Brass", subtitle: "Copper-Zinc Alloy", cls: "swatch-metals-brass", preview: "Resources/material images/Metals/Brass.jpg", desc: "A versatile copper-zinc alloy known for its golden-yellow color and luster. Smooth-textured, it develops a natural patina over time and is strong yet malleable for intricate designs." }
    ]
  };

  function init() {
    var grid = document.getElementById("materials-swatches-grid");
    if (!grid) return;
    var t = document.getElementById("material-detail-title");
    var s = document.getElementById("material-detail-subtitle");
    var d = document.getElementById("material-detail-desc");
    var img = document.getElementById("material-detail-img");
    var pills = document.querySelectorAll(".materials-pill");

    function setImg(it) {
      if (!img) return;
      img.style.opacity = "0";
      setTimeout(function () {
        img.src = it.preview;
        img.alt = it.name;
        img.style.opacity = "1";
      }, 150);
    }

    function fill(it) {
      if (t) t.innerText = it.name;
      if (s) s.innerText = it.subtitle || "";
      if (d) d.innerText = it.desc;
    }

    function render(cat) {
      var items = M[cat];
      if (!items || !items.length) return;
      grid.innerHTML = "";
      items.forEach(function (it, i) {
        var card = document.createElement("div");
        card.className = "swatch-card" + (i === 0 ? " active" : "");
        card.setAttribute("data-material", it.id);
        var bg = document.createElement("div");
        bg.className = "swatch-bg " + (it.cls || "");
        if (it.preview) {
          bg.style.backgroundImage = 'url("' + it.preview + '")';
          bg.style.backgroundSize = "cover";
          bg.style.backgroundPosition = "center";
        }
        var lab = document.createElement("div");
        lab.className = "swatch-label";
        lab.innerText = it.name;
        card.appendChild(bg);
        card.appendChild(lab);
        card.addEventListener("click", function () {
          var cs = grid.querySelectorAll(".swatch-card");
          for (var j = 0; j < cs.length; j++) cs[j].classList.remove("active");
          card.classList.add("active");
          fill(it);
          setImg(it);
        });
        grid.appendChild(card);
      });
      var f = items[0];
      fill(f);
      if (img && f.preview) {
        img.src = f.preview;
        img.alt = f.name;
        img.style.opacity = "1";
      }
    }

    if (pills) {
      pills.forEach(function (p) {
        p.addEventListener("click", function () {
          pills.forEach(function (x) { x.classList.remove("active"); });
          p.classList.add("active");
          render(p.getAttribute("data-category"));
        });
      });
    }

    render("wood");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
