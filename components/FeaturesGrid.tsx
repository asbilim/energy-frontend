import { motion } from "./motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Settings, MapPin, Zap } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Calculator,
    title: "Calculateur d'énergie",
    description: "Calculez la consommation d'énergie quotidienne avec la saisie de l'appareil",
    color: "bg-blue-500",
  },
  {
    icon: Settings,
    title: "Configuration du système",
    description: "Configurez des systèmes hors réseau ou connectés au réseau",
    color: "bg-green-500",
  },
  {
    icon: MapPin,
    title: "Analyse de l'emplacement",
    description: "Données d'irradiation solaire et de température",
    color: "bg-amber-500",
  },
  {
    icon: Zap,
    title: "Dimensionnement des composants",
    description: "Dimensionnement automatisé pour tous les composants du système",
    color: "bg-purple-500",
  },
];

const FeaturesGrid = () => (
  <motion.section
    className="mb-16"
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    variants={staggerChildren}>
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">Fonctionnalités complètes</h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Tout ce dont vous avez besoin pour concevoir, calibrer et optimiser les systèmes solaires photovoltaïques
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <motion.div key={index} variants={fadeInUp}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} rounded-lg mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default FeaturesGrid;
