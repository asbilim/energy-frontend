import { motion } from './motion'
import { Card, CardContent } from '@/components/ui/card'
import { Sun, Award, MapPin, Shield } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const stats = [
  { value: '10,000+', label: 'Systems Designed', icon: Sun },
  { value: '95%', label: 'Accuracy Rate', icon: Award },
  { value: '50+', label: 'Countries', icon: MapPin },
  { value: '24/7', label: 'Support', icon: Shield },
]

const StatsSection = () => (
  <motion.section
    className="mb-16"
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
    variants={staggerChildren}
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div key={index} variants={fadeInUp}>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </motion.section>
)

export default StatsSection 