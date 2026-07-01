import { z } from 'zod'

export const cartSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.number().int().positive(),
      quantity: z.number().int(),
      selectedModifiers: z.array(
        z.object({
          modifierId: z.number().int().positive(),
          optionIds: z.array(z.number().int().positive()),
        }),
      ),
    }),
  ),
})

export type Cart = z.infer<typeof cartSchema>
