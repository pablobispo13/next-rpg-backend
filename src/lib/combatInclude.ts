export const combatInclude = {
    characters: {
        include: {
            character: true,
        },
    },
    turn: {
        include: {
            character: true,
        },
    },
    logs: {
        orderBy: {
            createdAt: "asc" as const,
        },
        include: {
            character: {
                select: {
                    id: true,
                    name: true,
                },
            },
            target: {
                select: {
                    id: true,
                    name: true,
                },
            },
            roll: true,
        },
    },
};
