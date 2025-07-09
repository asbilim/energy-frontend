import { motion } from "./motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Mail } from "lucide-react";

const CtaSection = () => (
  <motion.section
    className="text-center"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}>
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      <CardContent className="pt-8 pb-8">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Design Your Solar System?
        </h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Join thousands of engineers and installers who trust SolarCal for
          professional solar system design.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="secondary" size="lg" className="gap-2">
            <Calculator className="h-5 w-5" />
            Get Started Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-white border-white hover:bg-white hover:text-blue-600">
            <Mail className="h-5 w-5" />
            Contact Sales
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.section>
);

export default CtaSection;
