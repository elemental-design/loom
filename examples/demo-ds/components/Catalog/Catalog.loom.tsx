import { VStack, HStack, Text, Divider, Image } from "@loom/primitives"
import { Badge } from "../Badge/Badge.loom"
import { Button } from "../Button/Button.loom"

export interface CatalogProps {
  heading: string
  items: { id: string; title: string; image: string }[]
  onLoadMore: () => void
}

export const loom = { id: "cmp_catalog", version: "1.0.0" } as const

export function Catalog({ heading, items, onLoadMore }: CatalogProps) {
  return (
    <VStack gap={6} padding={6} width="fill" background="surface">
      <HStack width="fill" justify="spaceBetween" align="center">
        <Text typography="title" color="textPrimary">
          {heading}
        </Text>
        <Badge count={42} />
      </HStack>
      <Divider />
      <VStack gap={4} width="fill">
        {items.map((item) => (
          <HStack key={item.id} gap={3} align="center" width="fill">
            <Image src={item.image} width={44} height={44} cornerRadius="full" resizeMode="cover" />
            <Text typography="body" color="textPrimary">
              {item.title}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Button label="Load more" intent="secondary" size="sm" onPress={onLoadMore} />
    </VStack>
  )
}
