window.storyConfig = {
  chapters: [
    {
      id: "intro",
      alignment: "left",
      chapterDiv: `
        <h3>The Great Migration</h3>
        <p>East Africa's savanna runs on a wet–dry rhythm. Wildebeest track the rains; predators respond in sync.</p>
      `,
      location: { center: [34.6, -1.8], zoom: 5.5, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Wildebeest_Tanzania_BG", opacity: 0.2 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Tanzania_BG", opacity: 0.05 }
      ]
    },

    // 旱季 6–9：北迁至 Mara
    {
      id: "dry-season",
      alignment: "right",
      chapterDiv: `
        <h3>Dry Season (Jun–Sep)</h3>
        <p>Herds concentrate in the Mara grasslands along perennial water. Tracks tighten northward.</p>
      `,
      location: { center: [34.85, -1.40], zoom: 7, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Wildebeest_Dry",        opacity: 0.9 },
        { layer: "Wildebeest_ShortRains", opacity: 0.0 },
        { layer: "Wildebeest_Wet",        opacity: 0.0 },
        { layer: "Wildebeest_Tracks",     opacity: 0.3 },
        { layer: "Tsavo_Lion",            opacity: 0.0 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Dry",    opacity: 0.3 },
        { layer: "Wildebeest_Tracks", opacity: 0.1 }
      ]
    },

    // 短雨季 10–11：开始回南
    {
      id: "short-rains",
      alignment: "left",
      chapterDiv: `
        <h3>Short Rains (Oct–Nov)</h3>
        <p>Moisture returns and herds arc southward through the corridor.</p>
      `,
      location: { center: [35.10, -2.10], zoom: 7, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Wildebeest_Dry",        opacity: 0.0 },
        { layer: "Wildebeest_ShortRains", opacity: 0.9 },
        { layer: "Wildebeest_Wet",        opacity: 0.0 },
        { layer: "Wildebeest_Tracks",     opacity: 0.3 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_ShortRains", opacity: 0.3 }
      ]
    },

    // 雨季 12–3：南部繁育
    {
      id: "wet-season",
      alignment: "right",
      chapterDiv: `
        <h3>Wet Season (Dec–Mar)</h3>
        <p>Calving on the southern short-grass plains; herds spread with fresh forage.</p>
      `,
      location: { center: [34.90, -2.10], zoom: 7, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Wildebeest_Wet",        opacity: 0.9 },
        { layer: "Wildebeest_Dry",        opacity: 0.0 },
        { layer: "Wildebeest_ShortRains", opacity: 0.0 },
        { layer: "Wildebeest_Tracks",     opacity: 0.3 }
      ],
      onChapterExit: [
        { layer: "Wildebeest_Wet",    opacity: 0.3 },
        { layer: "Wildebeest_Tracks", opacity: 0.1 }
      ]
    },

    // 平行生态：Tsavo 狮子
    {
      id: "lion",
      alignment: "left",
      chapterDiv: `
        <h3>Predator Dynamics: Tsavo Lions</h3>
        <p>Hundreds of kilometers east, lion activity shifts with the same dry–wet cycle.</p>
      `,
      location: { center: [38.60, -3.10], zoom: 7, pitch: 0, bearing: 0 },
      onChapterEnter: [
        { layer: "Tsavo_Lion", opacity: 0.9 }
      ],
      onChapterExit: [
        { layer: "Tsavo_Lion", opacity: 0.2 }
      ]
    },

    // 结尾
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
