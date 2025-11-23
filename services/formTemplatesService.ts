import { FormTemplate, StandardModule, KoboFormData, KoboQuestion, KoboSettings } from '../types';

// Standard Modules Library
const standardModules: StandardModule[] = [
    {
        id: 'demographics_household',
        name: 'Informations Ménage',
        description: 'Questions de base sur la composition et les caractéristiques du ménage',
        category: 'demographics',
        icon: '🏠',
        tags: ['ménage', 'famille', 'démographie'],
        questions: [
            {
                uid: 'household_size',
                type: 'integer',
                name: 'household_size',
                label: { fr: 'Nombre total de personnes dans le ménage', en: 'Total number of people in the household' },
                required: true,
                hint: { fr: 'Inclure tous les membres résidents', en: 'Include all resident members' }
            },
            {
                uid: 'household_head_name',
                type: 'text',
                name: 'household_head_name',
                label: { fr: 'Nom du chef de ménage', en: 'Name of household head' },
                required: true
            },
            {
                uid: 'household_head_gender',
                type: 'select_one',
                name: 'household_head_gender',
                label: { fr: 'Genre du chef de ménage', en: 'Gender of household head' },
                required: true,
                choices: [
                    { uid: 'male', name: 'male', label: { fr: 'Masculin', en: 'Male' } },
                    { uid: 'female', name: 'female', label: { fr: 'Féminin', en: 'Female' } }
                ]
            },
            {
                uid: 'household_head_age',
                type: 'integer',
                name: 'household_head_age',
                label: { fr: 'Âge du chef de ménage', en: 'Age of household head' },
                required: true,
                constraint: '. >= 18 and . <= 120',
                constraint_message: { fr: 'L\'âge doit être entre 18 et 120 ans', en: 'Age must be between 18 and 120' }
            }
        ]
    },
    {
        id: 'living_conditions_housing',
        name: 'Conditions d\'Habitation',
        description: 'Évaluation des conditions de logement et d\'habitation',
        category: 'living_conditions',
        icon: '🏘️',
        tags: ['logement', 'habitation', 'infrastructure'],
        questions: [
            {
                uid: 'housing_type',
                type: 'select_one',
                name: 'housing_type',
                label: { fr: 'Type d\'habitation', en: 'Type of housing' },
                required: true,
                choices: [
                    { uid: 'house', name: 'house', label: { fr: 'Maison individuelle', en: 'Individual house' } },
                    { uid: 'apartment', name: 'apartment', label: { fr: 'Appartement', en: 'Apartment' } },
                    { uid: 'compound', name: 'compound', label: { fr: 'Concession familiale', en: 'Family compound' } },
                    { uid: 'other', name: 'other', label: { fr: 'Autre', en: 'Other' } }
                ]
            },
            {
                uid: 'roof_material',
                type: 'select_one',
                name: 'roof_material',
                label: { fr: 'Matériau de toiture', en: 'Roof material' },
                required: true,
                choices: [
                    { uid: 'tiles', name: 'tiles', label: { fr: 'Tuiles', en: 'Tiles' } },
                    { uid: 'zinc', name: 'zinc', label: { fr: 'Tôle', en: 'Zinc' } },
                    { uid: 'thatch', name: 'thatch', label: { fr: 'Paille/Chaume', en: 'Thatch' } },
                    { uid: 'concrete', name: 'concrete', label: { fr: 'Béton', en: 'Concrete' } }
                ]
            },
            {
                uid: 'wall_material',
                type: 'select_one',
                name: 'wall_material',
                label: { fr: 'Matériau des murs', en: 'Wall material' },
                required: true,
                choices: [
                    { uid: 'brick', name: 'brick', label: { fr: 'Brique', en: 'Brick' } },
                    { uid: 'concrete', name: 'concrete', label: { fr: 'Béton', en: 'Concrete' } },
                    { uid: 'mud', name: 'mud', label: { fr: 'Boue/Banco', en: 'Mud/Adobe' } },
                    { uid: 'wood', name: 'wood', label: { fr: 'Bois', en: 'Wood' } }
                ]
            },
            {
                uid: 'access_water',
                type: 'select_one',
                name: 'access_water',
                label: { fr: 'Accès à l\'eau potable', en: 'Access to drinking water' },
                required: true,
                choices: [
                    { uid: 'piped_indoor', name: 'piped_indoor', label: { fr: 'Réseau intérieur', en: 'Piped indoor' } },
                    { uid: 'piped_outdoor', name: 'piped_outdoor', label: { fr: 'Réseau extérieur', en: 'Piped outdoor' } },
                    { uid: 'well', name: 'well', label: { fr: 'Puits', en: 'Well' } },
                    { uid: 'surface_water', name: 'surface_water', label: { fr: 'Eau de surface', en: 'Surface water' } }
                ]
            }
        ]
    },
    {
        id: 'economic_income',
        name: 'Situation Économique',
        description: 'Évaluation des revenus et de la situation économique du ménage',
        category: 'economic',
        icon: '💰',
        tags: ['revenus', 'économie', 'pauvreté'],
        questions: [
            {
                uid: 'main_income_source',
                type: 'select_one',
                name: 'main_income_source',
                label: { fr: 'Source principale de revenu', en: 'Main source of income' },
                required: true,
                choices: [
                    { uid: 'agriculture', name: 'agriculture', label: { fr: 'Agriculture', en: 'Agriculture' } },
                    { uid: 'commerce', name: 'commerce', label: { fr: 'Commerce', en: 'Commerce' } },
                    { uid: 'salary', name: 'salary', label: { fr: 'Salaire', en: 'Salary' } },
                    { uid: 'remittances', name: 'remittances', label: { fr: 'Transferts', en: 'Remittances' } },
                    { uid: 'other', name: 'other', label: { fr: 'Autre', en: 'Other' } }
                ]
            },
            {
                uid: 'monthly_income',
                type: 'integer',
                name: 'monthly_income',
                label: { fr: 'Revenus mensuels totaux (FCFA)', en: 'Total monthly income (FCFA)' },
                hint: { fr: 'Estimation en Francs CFA', en: 'Estimate in CFA Francs' }
            },
            {
                uid: 'owns_livestock',
                type: 'select_one',
                name: 'owns_livestock',
                label: { fr: 'Possession de bétail', en: 'Ownership of livestock' },
                required: true,
                choices: [
                    { uid: 'yes', name: 'yes', label: { fr: 'Oui', en: 'Yes' } },
                    { uid: 'no', name: 'no', label: { fr: 'Non', en: 'No' } }
                ]
            },
            {
                uid: 'owns_land',
                type: 'select_one',
                name: 'owns_land',
                label: { fr: 'Possession de terres agricoles', en: 'Ownership of agricultural land' },
                required: true,
                choices: [
                    { uid: 'yes', name: 'yes', label: { fr: 'Oui', en: 'Yes' } },
                    { uid: 'no', name: 'no', label: { fr: 'Non', en: 'No' } }
                ]
            }
        ]
    },
    {
        id: 'food_security_hunger',
        name: 'Sécurité Alimentaire',
        description: 'Évaluation de la sécurité alimentaire et des pratiques nutritionnelles',
        category: 'food_security',
        icon: '🍽️',
        tags: ['nutrition', 'faim', 'alimentation'],
        questions: [
            {
                uid: 'meals_per_day',
                type: 'integer',
                name: 'meals_per_day',
                label: { fr: 'Nombre de repas par jour', en: 'Number of meals per day' },
                required: true,
                constraint: '. >= 1 and . <= 5',
                constraint_message: { fr: 'Entre 1 et 5 repas', en: 'Between 1 and 5 meals' }
            },
            {
                uid: 'food_shortage_last_month',
                type: 'select_one',
                name: 'food_shortage_last_month',
                label: { fr: 'Pénurie alimentaire le mois dernier', en: 'Food shortage last month' },
                required: true,
                choices: [
                    { uid: 'never', name: 'never', label: { fr: 'Jamais', en: 'Never' } },
                    { uid: 'rarely', name: 'rarely', label: { fr: 'Rarement', en: 'Rarely' } },
                    { uid: 'sometimes', name: 'sometimes', label: { fr: 'Parfois', en: 'Sometimes' } },
                    { uid: 'often', name: 'often', label: { fr: 'Souvent', en: 'Often' } },
                    { uid: 'always', name: 'always', label: { fr: 'Toujours', en: 'Always' } }
                ]
            },
            {
                uid: 'dietary_diversity',
                type: 'select_multiple',
                name: 'dietary_diversity',
                label: { fr: 'Groupes alimentaires consommés hier', en: 'Food groups consumed yesterday' },
                hint: { fr: 'Cochez tous ceux qui s\'appliquent', en: 'Check all that apply' },
                choices: [
                    { uid: 'cereals', name: 'cereals', label: { fr: 'Céréales', en: 'Cereals' } },
                    { uid: 'tubers', name: 'tubers', label: { fr: 'Tubercules', en: 'Tubers' } },
                    { uid: 'vegetables', name: 'vegetables', label: { fr: 'Légumes', en: 'Vegetables' } },
                    { uid: 'fruits', name: 'fruits', label: { fr: 'Fruits', en: 'Fruits' } },
                    { uid: 'meat', name: 'meat', label: { fr: 'Viande', en: 'Meat' } },
                    { uid: 'fish', name: 'fish', label: { fr: 'Poisson', en: 'Fish' } },
                    { uid: 'eggs', name: 'eggs', label: { fr: 'Œufs', en: 'Eggs' } },
                    { uid: 'dairy', name: 'dairy', label: { fr: 'Produits laitiers', en: 'Dairy' } },
                    { uid: 'nuts', name: 'nuts', label: { fr: 'Noix/Graines', en: 'Nuts/Seeds' } },
                    { uid: 'oil', name: 'oil', label: { fr: 'Huiles/Graisses', en: 'Oils/Fats' } }
                ]
            }
        ]
    },
    {
        id: 'protection_violence',
        name: 'Protection et Violence',
        description: 'Évaluation des risques de protection et d\'exposition à la violence',
        category: 'protection',
        icon: '🛡️',
        tags: ['protection', 'violence', 'sécurité'],
        questions: [
            {
                uid: 'feels_safe',
                type: 'select_one',
                name: 'feels_safe',
                label: { fr: 'Vous sentez-vous en sécurité dans votre communauté ?', en: 'Do you feel safe in your community?' },
                required: true,
                choices: [
                    { uid: 'very_safe', name: 'very_safe', label: { fr: 'Très en sécurité', en: 'Very safe' } },
                    { uid: 'somewhat_safe', name: 'somewhat_safe', label: { fr: 'Assez en sécurité', en: 'Somewhat safe' } },
                    { uid: 'not_safe', name: 'not_safe', label: { fr: 'Pas en sécurité', en: 'Not safe' } },
                    { uid: 'very_unsafe', name: 'very_unsafe', label: { fr: 'Très dangereux', en: 'Very unsafe' } }
                ]
            },
            {
                uid: 'experienced_violence',
                type: 'select_one',
                name: 'experienced_violence',
                label: { fr: 'Avez-vous été victime de violence au cours des 12 derniers mois ?', en: 'Have you experienced violence in the past 12 months?' },
                required: true,
                choices: [
                    { uid: 'yes', name: 'yes', label: { fr: 'Oui', en: 'Yes' } },
                    { uid: 'no', name: 'no', label: { fr: 'Non', en: 'No' } }
                ]
            },
            {
                uid: 'violence_type',
                type: 'select_multiple',
                name: 'violence_type',
                label: { fr: 'Type(s) de violence subie', en: 'Type(s) of violence experienced' },
                relevant: '${experienced_violence} = \'yes\'',
                choices: [
                    { uid: 'physical', name: 'physical', label: { fr: 'Violence physique', en: 'Physical violence' } },
                    { uid: 'sexual', name: 'sexual', label: { fr: 'Violence sexuelle', en: 'Sexual violence' } },
                    { uid: 'psychological', name: 'psychological', label: { fr: 'Violence psychologique', en: 'Psychological violence' } },
                    { uid: 'economic', name: 'economic', label: { fr: 'Violence économique', en: 'Economic violence' } }
                ]
            }
        ]
    },
    {
        id: 'education_schooling',
        name: 'Éducation et Scolarisation',
        description: 'Informations sur l\'accès à l\'éducation et la scolarisation des enfants',
        category: 'education',
        icon: '📚',
        tags: ['éducation', 'scolarisation', 'enfants'],
        questions: [
            {
                uid: 'school_age_children',
                type: 'integer',
                name: 'school_age_children',
                label: { fr: 'Nombre d\'enfants en âge de scolarisation (6-17 ans)', en: 'Number of school-age children (6-17 years)' },
                required: true,
                constraint: '. >= 0',
                hint: { fr: 'Enfants âgés de 6 à 17 ans', en: 'Children aged 6-17 years' }
            },
            {
                uid: 'children_in_school',
                type: 'integer',
                name: 'children_in_school',
                label: { fr: 'Nombre d\'enfants scolarisés', en: 'Number of children in school' },
                required: true,
                constraint: '. <= ${school_age_children}',
                constraint_message: { fr: 'Ne peut pas dépasser le nombre d\'enfants en âge scolaire', en: 'Cannot exceed number of school-age children' }
            },
            {
                uid: 'school_distance',
                type: 'select_one',
                name: 'school_distance',
                label: { fr: 'Distance à l\'école la plus proche', en: 'Distance to nearest school' },
                required: true,
                choices: [
                    { uid: 'less_1km', name: 'less_1km', label: { fr: 'Moins de 1 km', en: 'Less than 1 km' } },
                    { uid: '1_3km', name: '1_3km', label: { fr: '1-3 km', en: '1-3 km' } },
                    { uid: '3_5km', name: '3_5km', label: { fr: '3-5 km', en: '3-5 km' } },
                    { uid: 'more_5km', name: 'more_5km', label: { fr: 'Plus de 5 km', en: 'More than 5 km' } }
                ]
            },
            {
                uid: 'education_barriers',
                type: 'select_multiple',
                name: 'education_barriers',
                label: { fr: 'Obstacles à la scolarisation', en: 'Barriers to education' },
                hint: { fr: 'Cochez tous ceux qui s\'appliquent', en: 'Check all that apply' },
                choices: [
                    { uid: 'cost', name: 'cost', label: { fr: 'Coûts (frais de scolarité, fournitures)', en: 'Cost (school fees, supplies)' } },
                    { uid: 'distance', name: 'distance', label: { fr: 'Distance', en: 'Distance' } },
                    { uid: 'child_labor', name: 'child_labor', label: { fr: 'Travail des enfants', en: 'Child labor' } },
                    { uid: 'lack_teachers', name: 'lack_teachers', label: { fr: 'Manque d\'enseignants', en: 'Lack of teachers' } },
                    { uid: 'infrastructure', name: 'infrastructure', label: { fr: 'Manque d\'infrastructure', en: 'Lack of infrastructure' } },
                    { uid: 'cultural', name: 'cultural', label: { fr: 'Raisons culturelles', en: 'Cultural reasons' } }
                ]
            }
        ]
    }
];

// Form Templates Library
const formTemplates: FormTemplate[] = [
    {
        id: 'humanitarian_baseline',
        name: 'Évaluation Humanitaire de Base',
        description: 'Évaluation complète des besoins humanitaires incluant démographie, conditions de vie et sécurité alimentaire',
        category: 'humanitarian',
        icon: '🏥',
        modules: ['demographics_household', 'living_conditions_housing', 'economic_income', 'food_security_hunger', 'protection_violence'],
        settings: {
            form_title: 'Évaluation Humanitaire de Base',
            form_id: 'humanitarian_baseline',
            version: '1.0',
            default_language: 'fr'
        },
        isCustomizable: true
    },
    {
        id: 'education_monitoring',
        name: 'Suivi Éducation',
        description: 'Monitoring de l\'accès à l\'éducation et des indicateurs de scolarisation',
        category: 'education',
        icon: '📚',
        modules: ['demographics_household', 'education_schooling'],
        settings: {
            form_title: 'Suivi Éducation',
            form_id: 'education_monitoring',
            version: '1.0',
            default_language: 'fr'
        },
        isCustomizable: true
    },
    {
        id: 'sustainable_livelihoods',
        name: 'Moyens d\'Existence Durables',
        description: 'Évaluation des moyens d\'existence et de la résilience économique',
        category: 'sustainable_development',
        icon: '🌱',
        modules: ['demographics_household', 'economic_income', 'food_security_hunger'],
        settings: {
            form_title: 'Moyens d\'Existence Durables',
            form_id: 'sustainable_livelihoods',
            version: '1.0',
            default_language: 'fr'
        },
        isCustomizable: true
    },
    {
        id: 'health_nutrition',
        name: 'Santé et Nutrition',
        description: 'Évaluation des indicateurs de santé et de nutrition communautaire',
        category: 'health',
        icon: '⚕️',
        modules: ['demographics_household', 'food_security_hunger'],
        settings: {
            form_title: 'Santé et Nutrition',
            form_id: 'health_nutrition',
            version: '1.0',
            default_language: 'fr'
        },
        isCustomizable: true
    },
    {
        id: 'agriculture_livelihoods',
        name: 'Agriculture et Moyens d\'Existence',
        description: 'Évaluation des pratiques agricoles et de leur impact sur les moyens d\'existence',
        category: 'agriculture',
        icon: '🌾',
        modules: ['demographics_household', 'economic_income', 'food_security_hunger'],
        settings: {
            form_title: 'Agriculture et Moyens d\'Existence',
            form_id: 'agriculture_livelihoods',
            version: '1.0',
            default_language: 'fr'
        },
        isCustomizable: true
    }
];

class FormTemplatesService {
    getTemplates(): FormTemplate[] {
        return formTemplates;
    }

    getStandardModules(): StandardModule[] {
        return standardModules;
    }

    getModuleById(moduleId: string): StandardModule | undefined {
        return standardModules.find(module => module.id === moduleId);
    }

    getTemplateById(templateId: string): FormTemplate | undefined {
        return formTemplates.find(template => template.id === templateId);
    }

    createFormFromTemplate(template: FormTemplate): KoboFormData {
        const survey: KoboQuestion[] = [];
        let questionIndex = 1;

        // Add questions from each module
        template.modules.forEach(moduleId => {
            const module = this.getModuleById(moduleId);
            if (module) {
                module.questions.forEach(question => {
                    survey.push({
                        ...question,
                        uid: `${moduleId}_${question.uid}_${questionIndex++}`
                    });
                });
            }
        });

        return {
            settings: template.settings,
            survey,
            choices: []
        };
    }

    createFormFromModules(moduleIds: string[]): KoboFormData {
        const survey: KoboQuestion[] = [];
        let questionIndex = 1;

        // Add questions from selected modules
        moduleIds.forEach(moduleId => {
            const module = this.getModuleById(moduleId);
            if (module) {
                module.questions.forEach(question => {
                    survey.push({
                        ...question,
                        uid: `${moduleId}_${question.uid}_${questionIndex++}`
                    });
                });
            }
        });

        // Create default settings
        const settings: KoboSettings = {
            form_title: 'Formulaire Personnalisé',
            form_id: 'custom_form',
            version: '1.0',
            default_language: 'fr'
        };

        return {
            settings,
            survey,
            choices: []
        };
    }

    getModulesByCategory(category: string): StandardModule[] {
        if (category === 'all') return standardModules;
        return standardModules.filter(module => module.category === category);
    }

    getTemplatesByCategory(category: string): FormTemplate[] {
        if (category === 'all') return formTemplates;
        return formTemplates.filter(template => template.category === category);
    }
}

export const formTemplatesService = new FormTemplatesService();
