(function () {
  var M = {
    wood: [
      { id: "teak", name: "Teak", subtitle: "Tectona grandis", cls: "swatch-wood-teak", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bdd608f15ab8b132e_6684d13be6fded236edf434c_66784913da68c8264ab3b661_Reclaimed%252520Teak.png", desc: "Renowned for its rich golden to medium brown hues that deepen with age, teak's straight grain and coarse texture exude timeless elegance. Naturally resistant to water, rot, and pests, its durability ensures lasting beauty with minimal upkeep." },
      { id: "honne", name: "Honne", subtitle: "Intsia bijuga", cls: "swatch-wood-honne", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bd362cf5fcc6f199f_6684d13a007aa9790384b31a_667849249a616f8ae8e17198_Honne.png", desc: "Characterized by rich, golden to reddish-brown color, which deepens over time, adding warmth and character. Its straight, fine grain makes it ideal for furniture, flooring, and cabinetry. Notably resistant to decay, termites, and fungal attacks." },
      { id: "matti", name: "Matti", subtitle: "Terminalia elliptica", cls: "swatch-wood-matti", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bfe70716c8309c5ce_6684d13a9c12b76d06f85c52_667849369e20be0b462e46bc_Bhilwara.png", desc: "Also known as Indian Laurel, this hardwood ranges in colour from deep brown to almost black, with a grain reminiscent of walnut. Dense and heavy, it offers exceptional strength and durability." },
      { id: "pinewood", name: "Pinewood", subtitle: "Pinus spp", cls: "", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b5e5a5bcc3b3b458a_67c94441373cbaa21b613a32_Pine%2520wood%2520texture.jpeg", desc: "A pale yellow to light brown softwood with a straight to slightly wavy grain and medium-to-coarse texture. Easy to work with and sturdy, ideal for carpentry and joinery." }
    ],
    leather: [
      { id: "glory-honey", name: "Glory Honey", subtitle: "Premium Hide", cls: "swatch-leather-glory-honey", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/66cec28e6c0a94cedbd36d0a_Glory%20Honey.jpeg", desc: "A celebration of nature's glorious irregularities. This naked hide becomes your lifelong canvas, absorbing every encounter and moulded by each touch as you leave a distinct mark." },
      { id: "vagabond-cognac", name: "Vagabond Cognac", subtitle: "Full-Grain Leather", cls: "swatch-leather-vagabond-cognac", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b7de43506beb353c0_66cec1611ea4dfc3029cb4d7_Vagabond%2520Cognac.jpeg", desc: "A premium full-grain leather with rich, deep brown color and a luxurious feel. Its natural, uncorrected grain showcases the hide's unique textures with a smooth, supple touch and slight sheen." },
      { id: "montana-chestnut", name: "Montana Chestnut", subtitle: "Aniline Leather", cls: "swatch-leather-montana-chestnut", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827205822401f3fb50795e0_66cec2f5d466a439da82b609_Montana%2520Chestnut.jpeg", desc: "Only the most premium hides make for an aniline finish that retains natural textures and grain. Soaked in oils and well moisturized for a natural sheen, cushiony appearance, and supple feel." },
      { id: "emperor-brick", name: "Emperor Brick", subtitle: "Natural Grain Hide", cls: "swatch-leather-emperor-brick", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272058381cbcd3e131788e_66cec26058701322df701984_Emperor%2520Brick.jpeg", desc: "A thick hide with good body in a completely natural grain. Plush and pleasing to the touch, the high drama of the grains commands attention while forgiving small incidents magnanimously." },
      { id: "eternity-olive", name: "Eternity Olive", subtitle: "Soft Pliable Hide", cls: "swatch-leather-eternity-olive", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272058ea1975a65ccf41a6_66cec1aafc679d086da87306_Eternity%2520Olive.jpeg", desc: "Soft and pliable hides that drape like a dream. A cloudy two-tone effect and deep earthy tones combine with natural sheen for shine and sophistication in any sleek setting." }
    ],
    fabric: [
      { id: "butter", name: "Butter", subtitle: "Easy-Clean Coating", cls: "swatch-fabric-butter", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720157de43506beb3e391_67c6caa80801b708fdf2e726_DDecor%2520Comfort%25203%2520Rustic%2520Basketry%2520Butter.jpeg", desc: "Soft warm fabric with special easy-clean coating for high endurance, ideal for parents and pet-owners." },
      { id: "blush", name: "Blush", subtitle: "Herringbone Pattern", cls: "swatch-fabric-blush", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272015403a98807dabdf75_66d5aca6a935ad183c8e3d5c_Blush.jpeg", desc: "Muted fabric with a subtle Herringbone pattern that adds visual texture to your cushions." },
      { id: "rosebud", name: "Rosebud", subtitle: "Classic Indoor Fabric", cls: "swatch-fabric-rosebud", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720164dfecc77247f0b23_66cec38e223f22ca60d7f61e_Rosebud.png", desc: "Casual yet classic, Rosebud is versatile as an indoor fabric, great for interiors with a muted colour palette." },
      { id: "rubik-linen", name: "Rubik Linen", subtitle: "Textured Linen", cls: "swatch-fabric-rubik-linen", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201614898a0f1ef8fae8_66cec3b3736f9095d2f47d8a_Rubik%2520Linen.jpeg", desc: "Textured and soft fabric for bright interiors; contrasts well with our wood options." },
      { id: "silver", name: "Silver", subtitle: "Herringbone Velvet Finish", cls: "swatch-fabric-silver", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201675c9ffb28b97be67_67c6c947f251ade2c21f630b_Marion%2520Silver%2520website%2520image.png", desc: "Classy and understated fabric with a subtle Herringbone pattern and velvet-like finish." },
      { id: "cloud", name: "Cloud", subtitle: "Reserved Grey Linen", cls: "swatch-fabric-cloud", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201686cd6c20f65bfebd_66cec3c0b4b431d8064591dc_Cloud.jpeg", desc: "Linen option with a reserved grey finish to match any and every interiors palette." },
      { id: "opal", name: "Opal", subtitle: "Bold Hue Fabric", cls: "swatch-fabric-opal", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272016ea1975a65ccf045a_66cec3a0d44c5c37471c6e72_Opal.png", desc: "Bright and bold hue perfect for adding invigorating pops of colour to furniture and cushions." },
      { id: "vienna", name: "Vienna", subtitle: "Understated Opulence Velvet", cls: "swatch-fabric-vienna", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272016e349c81eb78deae0_67c1868f9234871b00513025_Vienna%2520Army.jpeg", desc: "Ideal for upholstery with understated opulence; a soft, velvety touch adding subtle luminosity to living spaces." },
      { id: "flute", name: "Flute", subtitle: "Deep Navy Striped Fabric", cls: "swatch-fabric-flute", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720157c98d145afc53748_66d5acbf57e9afbb44cfa786_Flute.jpeg", desc: "Striking lines in deep navy to add a vibrant texture to the furniture and space." },
      { id: "charcoal", name: "Charcoal", subtitle: "Plush Chenille Yarn", cls: "swatch-fabric-charcoal", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201786586d244fb7e451_66cec368f97fa4893227f3a2_Charcoal.png", desc: "Its chenille yarn offers a plush, multi-tonal finish, perfect for upholstery such as sofas or chairs." }
    ],
    cane: [
      { id: "woven-cane", name: "Woven Cane", subtitle: "Natural Rattan Vine", cls: "swatch-cane-woven-cane", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b453b55e1b9a21c03_6684d13aa6725a68337cc74f_66784e83c198b5a75b916393_Cane%252520Weave.png", desc: "Crafted from rattan vine, woven cane brings light and airy beauty with warm tones and surprising durability. Lightweight, breathable, and low-maintenance." }
    ],
    metals: [
      { id: "brass", name: "Brass", subtitle: "Copper-Zinc Alloy", cls: "swatch-metals-brass", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7c4efe0f82a1ee7847_67c94a5ccae97b8acf9ee4bd_brass-rod-port.jpeg", desc: "A versatile copper-zinc alloy known for its golden-yellow color and luster. Smooth-textured, it develops a natural patina over time and is strong yet malleable for intricate designs." }
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
