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
    title: "Energy Calculator",
    description: "Calculate daily energy consumption with device input",
    color: "bg-blue-500",
  },
  {
    icon: Settings,
    title: "System Configuration",
    description: "Configure off-grid or grid-tied systems",
    color: "bg-green-500",
  },
  {
    icon: MapPin,
    title: "Location Analysis",
    description: "Solar irradiation and temperature data",
    color: "bg-amber-500",
  },
  {
    icon: Zap,
    title: "Component Sizing",
    description: "Automated sizing for all system components",
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
      <h2 className="text-3xl font-bold mb-4">Comprehensive Features</h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Everything you need to design, calibrate, and optimize solar PV systems
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
