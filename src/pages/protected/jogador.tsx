import MesaJogador from "../../components/Jogador/MesaJogador";


type Props = {
    isSpectator?: boolean;
    forcedCharacterId?: string | null;
};

export default function Jogador({
    isSpectator = false,
    forcedCharacterId,
}: Props) {
    return (
        <MesaJogador
            isSpectator={isSpectator}
            forcedCharacterId={forcedCharacterId}
        />
    );
}