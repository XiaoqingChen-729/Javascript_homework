// 这里放“属性数据”，主要用于侧栏列表 & 详情。
// 真正的几何边界在 data/parks.geojson 里。

const PARKS_META = [
  {
    id: "serengeti",
    name: "Serengeti National Park",
    country: "Tanzania",
    visitors_2024: 589000, // 示例
    predator_index: 5,
    has_big_five: true,
    in_migration_route: true,
    main_species: ["Lion", "Cheetah", "Wildebeest"],
    storymap_url: "https://你的-storymap-链接-如果有的话"
  },
  {
    id: "maasai_mara",
    name: "Maasai Mara National Reserve",
    country: "Kenya",
    visitors_2024: 400000,
    predator_index: 5,
    has_big_five: true,
    in_migration_route: true,
    main_species: ["Lion", "Leopard", "Wildebeest"],
    storymap_url: "https://你的-storymap-链接-如果有的话"
  },
  {
    id: "ngorongoro",
    name: "Ngorongoro Conservation Area",
    country: "Tanzania",
    visitors_2024: 350000,
    predator_index: 4,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Lion", "Black Rhino", "Elephant"],
    storymap_url: ""
  },
  {
    id: "lake_manyara",
    name: "Lake Manyara National Park",
    country: "Tanzania",
    visitors_2024: 150000,
    predator_index: 3,
    has_big_five: false,
    in_migration_route: false,
    main_species: ["Flamingos", "Elephant"],
    storymap_url: ""
  },
  {
    id: "tarangire",
    name: "Tarangire National Park",
    country: "Tanzania",
    visitors_2024: 120000,
    predator_index: 3,
    has_big_five: false,
    in_migration_route: false,
    main_species: ["Elephant", "Lion"],
    storymap_url: ""
  },
  {
    id: "amboseli",
    name: "Amboseli National Park",
    country: "Kenya",
    visitors_2024: 200000,
    predator_index: 4,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Elephant", "Lion"],
    storymap_url: ""
  },
  {
    id: "tsavo_east",
    name: "Tsavo East National Park",
    country: "Kenya",
    visitors_2024: 120000,
    predator_index: 3,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Lion", "Elephant"],
    storymap_url: ""
  },
  {
    id: "tsavo_west",
    name: "Tsavo West National Park",
    country: "Kenya",
    visitors_2024: 90000,
    predator_index: 3,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Lion", "Leopard"],
    storymap_url: ""
  },
  {
    id: "nairobi_np",
    name: "Nairobi National Park",
    country: "Kenya",
    visitors_2024: 150000,
    predator_index: 3,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Lion", "Rhino"],
    storymap_url: ""
  },
  {
    id: "kruger",
    name: "Kruger National Park",
    country: "South Africa",
    visitors_2024: 1000000,
    predator_index: 5,
    has_big_five: true,
    in_migration_route: false,
    main_species: ["Lion", "Leopard", "Elephant"],
    storymap_url: ""
  }
];
