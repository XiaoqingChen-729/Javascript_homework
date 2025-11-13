window.storyConfig = {
  chapters: [
    {
      id: "intro",
      alignment: "left",
      chapterDiv: `
        <h3>The Great Migration</h3>
        <p>East Africa's savanna runs on a wet-dry rhythm. Wildebeest track the rains; predators respond in sync.</p>
      `,
      location: {
        bounds: [
          [34.20, -3.60],
          [36.10, -0.80]
        ],
        padding: [60, 60]
      },
      focusLayers: ["Mara_Serengeti_Boundary"],
      focusMaxZoom: 8,
      focusPadding: [48, 48],
      onChapterEnter: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.9 },
        { layer: "Wildebeest_Tanzania_BG", opacity: 0.0 },
        { layer: "Wildebeest_Tracks",      opacity: 0.0 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
      ],
      onChapterExit: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.0 },
        { layer: "Wildebeest_Tanzania_BG", opacity: 0.0 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
      ]
    },

    // Dry season 6–9：Move north to Mara
    {
      id: "dry-season",
      alignment: "right",
      chapterDiv: `
        <h3>Dry Season (Jun-Sep)</h3>
        <p>Herds concentrate in the Mara grasslands along perennial water. Tracks tighten northward.</p>
      `,
      location: {
        center: [34.85, -1.40],
        zoom: 7,
        pitch: 0,
        bearing: 0,
        bounds: [
          [34.70, -2.55],
          [35.95, -0.95]
        ],
        padding: [60, 60]
      },
      focusLayers: ["Wildebeest_Dry_clean"],
      focusMaxZoom: 9,
      focusPadding: [36, 36],
      onChapterEnter: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.0 },
        { layer: "Wildebeest_Dry_clean",   opacity: 0.9 },
        { layer: "Wildebeest_Short_clean", opacity: 0.0 },
        { layer: "Wildebeest_Wet_clean",   opacity: 0.0 },
        { layer: "Wildebeest_AprMay",      opacity: 0.0 },
        { layer: "Wildebeest_Tracks",      opacity: 0.3 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Dry_clean",   opacity: 0.3 },
        { layer: "Wildebeest_Tracks",      opacity: 0.1 }
      ]
    },

    // Short rain season 10–11：Turn to south
    {
      id: "short-rains",
      alignment: "left",
      chapterDiv: `
        <h3>Short Rains (Oct-Nov)</h3>
        <p>Moisture returns and herds arc southward through the corridor.</p>
      `,
      location: {
        center: [35.10, -2.10],
        zoom: 7,
        pitch: 0,
        bearing: 0,
        bounds: [
          [34.95, -1.85],
          [35.85, -0.95]
        ],
        padding: [60, 60]
      },
      focusLayers: ["Wildebeest_Short_clean"],
      focusMaxZoom: 9,
      focusPadding: [36, 36],
      onChapterEnter: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.0 },
        { layer: "Wildebeest_Dry_clean",   opacity: 0.0 },
        { layer: "Wildebeest_Short_clean", opacity: 0.9 },
        { layer: "Wildebeest_Wet_clean",   opacity: 0.0 },
        { layer: "Wildebeest_AprMay",      opacity: 0.0 },
        { layer: "Wildebeest_Tracks",      opacity: 0.3 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Short_clean", opacity: 0.3 }
      ]
    },

    // Wet season 12–3：brithing on southern plains
    {
      id: "wet-season",
      alignment: "right",
      chapterDiv: `
        <h3>Wet Season (Dec-Mar)</h3>
        <p>Calving on the southern short-grass plains; herds spread with fresh forage.</p>
      `,
      location: {
        center: [34.90, -2.10],
        zoom: 7,
        pitch: 0,
        bearing: 0,
        bounds: [
          [34.70, -3.55],
          [35.95, -1.00]
        ],
        padding: [60, 60]
      },
      focusLayers: ["Wildebeest_Wet_clean"],
      focusMaxZoom: 12,
      focusPadding: [36, 36],
      onChapterEnter: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.0 },
        { layer: "Wildebeest_Wet_clean",   opacity: 0.9 },
        { layer: "Wildebeest_Dry_clean",   opacity: 0.0 },
        { layer: "Wildebeest_Short_clean", opacity: 0.0 },
        { layer: "Wildebeest_AprMay",      opacity: 0.0 },
        { layer: "Wildebeest_Tracks",      opacity: 0.3 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Wet_clean",   opacity: 0.3 },
        { layer: "Wildebeest_Tracks",      opacity: 0.1 }
      ]
    },

    // Early dry season 4-5：Move south through corridor
    {
      id: "early-dry",
      alignment: "right",
      chapterDiv: `
        <h3>Early Dry (Apr-May)</h3>
        <p>Moisture returns and herds arc southward through the corridor.</p>
        `,
      location: {
        center: [34.90, -2.10],
        zoom: 7,
        pitch: 0,
        bearing: 0,
        bounds: [
          [34.70, -3.55],
          [35.95, -1.00]
        ],
        padding: [60, 60]
      },
      focusLayers: ["Wildebeest_AprMay"],    // 
      focusMaxZoom: 12,
      focusPadding: [36, 36],
      onChapterEnter: [
        { layer: "Mara_Serengeti_Boundary",opacity: 0.0 },
        { layer: "Wildebeest_Dry_clean",   opacity: 0.0 }, 
        { layer: "Wildebeest_Short_clean", opacity: 0.0 }, 
        { layer: "Wildebeest_Wet_clean",   opacity: 0.0 },
        { layer: "Wildebeest_AprMay",      opacity: 0.9 }, 
        { layer: "Wildebeest_Tracks",      opacity: 0.3 },
        { layer: "Tsavo_Lion",             opacity: 0.0 },
        { layer: "Tsavo_Lion_Tracks",      opacity: 0.0 }
        ],
      onChapterExit: [
        { layer: "Wildebeest_AprMay", opacity: 0.3 } 
      ]
    },
  

    // Balanced ecosystem：Tsavo lions respond
    {
      id: "lion",
      alignment: "left",
      chapterDiv: `
        <h3>Predator Dynamics: Tsavo Lions</h3>
        <p>Hundreds of kilometers east, lion activity shifts with the same dry–wet cycle.</p>
      `,
      location: {
        bounds: [
          [38.60, -4.25],
          [39.05, -3.55]
        ],
        padding: [40, 40]
      },
      focusLayers: ["Tsavo_Lion"],
      focusMaxZoom: 7,
      focusPadding: [36, 36],
      onChapterEnter: [
        { layer: "Tsavo_Lion", opacity: 0.9 },
        { layer: "Tsavo_Lion_Tracks", opacity: 0.8 }
      ],
      onChapterExit: [
        { layer: "Tsavo_Lion", opacity: 0.2 },
        { layer: "Tsavo_Lion_Tracks", opacity: 0.2 }
      ]
    },

    // Conclusion：Protecting corridors
    {
      id: "conclusion",
      alignment: "full",
      chapterDiv: `
        <h3>Why It Matters</h3>
        <p>Protecting rain-driven corridors safeguards an entire food web.</p>
        <p class="small">Data: Movebank (processed to GeoJSON). Author: You.</p>
      `,
      location: { center: [34.6, -1.8], zoom: 5.5, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Wildebeest_Tanzania_BG", opacity: 0.15 }
      ],
      onChapterExit: []
    }
  ]
};
