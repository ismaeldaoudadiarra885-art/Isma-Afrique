// FIX: Corrected import path
import { GlossaryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const glossaryData: GlossaryEntry[] = [
    {
        id: uuidv4(),
        term: 'relevant',
        definition_fr: "Logique de pertinence. Une condition qui détermine si une question doit être affichée ou masquée en fonction des réponses précédentes.",
        explanation_bm: "‘relevant’ ye sariya ye. A b’a yira ni nyininka kɛrɛnkɛrɛnnen dɔ ka kan ka yira walima ka dogo, ka da jaabiliw kan minnu kɛra a ɲɛ." ,
        category: 'XLSForm',
        level: 'analyste',
        example_local: "Exemple: La question sur la grossesse ne sera pertinente que si la réponse à la question 'genre' est 'Femme'."
    },
    {
        id: uuidv4(),
        term: 'constraint',
        definition_fr: "Contrainte de validation. Une règle qui vérifie si la réponse saisie est valide. Par exemple, l'âge doit être supérieur à 18.",
        explanation_bm: "'constraint' ye sariya ye min b'a lajɛ ni jaabili min sɛbɛnna, o bɛ ka nɔgɔn. Misali la, san ka kan ka tɛmɛ san 18 kan.",
        category: 'XLSForm',
        level: 'analyste',
        example_local: "Pour une question sur l'âge, une contrainte pourrait être '. > 18 and . < 99'."
    },
    {
        id: uuidv4(),
        term: 'calculate',
        definition_fr: "Une question qui effectue un calcul automatique en arrière-plan en utilisant les réponses à d'autres questions.",
        explanation_bm: "‘calculate’ ye nyininka ye min bɛ jate kɛ otomatikiman na kɔfɛ, ka baara kɛ ni jaabiliw ye ka bɔ nyininka wɛrɛw la.",
        category: 'XLSForm',
        level: 'institutionnel',
    },
    {
        id: uuidv4(),
        term: 'Ménage',
        definition_fr: "Un groupe de personnes qui vivent ensemble et partagent les repas. Il est important de bien définir ce terme au début de l'enquête.",
        explanation_bm: "‘Ménage’ kɔrɔ ye mɔgɔ talan ye minnu bɛ sigi ɲɔgɔn fɛ ka dumuni kɛ ɲɔgɔn fɛ. A ka fisa ka o daɲɛ in lakika lajɛ nsɛnɛfɔ a daminɛ na.",
        category: 'Culturel',
        level: 'terrain',
        example_local: "Au Mali, un ménage peut inclure la famille étendue. Il faut préciser si l'on parle de 'ménage nucléaire' ou de 'concession'."
    },
    {
        id: uuidv4(),
        term: 'API',
        definition_fr: "Interface de Programmation d'Application. Un moyen pour deux logiciels de communiquer entre eux.",
        explanation_bm: "‘API’ kɔrɔ ye Application Programming Interface ye. O ye sira ye min bɛ ɛntɛrinɛti porogaramu fila la ka kuma ɲɔgɔn fɛ.",
        category: 'Technique',
        level: 'institutionnel',
    },
];