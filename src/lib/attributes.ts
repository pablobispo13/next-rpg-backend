import { AttributeType } from "@prisma/client";

export function getAttributeValue(
    character: any,/* eslint-disable  @typescript-eslint/no-explicit-any */
    attribute: AttributeType
): number {
    return Number(character[attribute.toLowerCase()] ?? 0);
}
