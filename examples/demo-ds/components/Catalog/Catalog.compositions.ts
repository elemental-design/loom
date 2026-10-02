import type { CatalogProps } from "./Catalog.loom"
export const compositions: { name: string; props: CatalogProps }[] = [
  {
    name: "Three items",
    props: {
      heading: "Catalog",
      items: [
        { id: "1", title: "First item", image: "/placeholder.png" },
        { id: "2", title: "Second item", image: "/placeholder.png" },
        { id: "3", title: "Third item", image: "/placeholder.png" },
      ],
      onLoadMore: () => {},
    },
  },
]
