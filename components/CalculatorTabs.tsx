"use client";
import React, { useState } from "react";
import { motion } from "./motion";
import {
  Calculator,
  Settings,
  Gauge,
  BarChart3,
  Plus,
  Trash2,
  Sun,
  Battery,
  Zap,
  FileText,
  Download,
  Save,
  MapPin,
  Info,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Device {
  id: number;
  name: string;
  power: number;
  hours: number;
  quantity: number;
}

interface DeviceInput {
  name: string;
  power: number;
  hours: number;
  quantity: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const CalculatorTabs = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDevice, setNewDevice] = useState<DeviceInput>({
    name: "",
    power: 0,
    hours: 0,
    quantity: 1,
  });
  const [systemType, setSystemType] = useState("");
  const [location, setLocation] = useState("");

  const addDevice = () => {
    if (newDevice.name && newDevice.power && newDevice.hours) {
      setDevices([...devices, { ...newDevice, id: Date.now() }]);
      setNewDevice({ name: "", power: 0, hours: 0, quantity: 1 });
    }
  };

  const removeDevice = (id: number) => {
    setDevices(devices.filter((device) => device.id !== id));
  };

  const getTotalConsumption = () => {
    return devices.reduce((total, device) => {
      return total + (device.power * device.hours * device.quantity) / 1000;
    }, 0);
  };

  const getTotalPower = () => {
    return devices.reduce((total, device) => {
      return total + device.power * device.quantity;
    }, 0);
  };

  return (
    <motion.section
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}>
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="configuration" className="gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="calibration" className="gap-2">
            <Gauge className="h-4 w-4" />
            Calibration
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Device Input */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Energy Consumption Calculator</CardTitle>
                <CardDescription>
                  Add your electrical devices to calculate daily energy
                  consumption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-name">Device Name</Label>
                    <Input
                      id="device-name"
                      placeholder="LED Light"
                      value={newDevice.name}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="power">Power (W)</Label>
                    <Input
                      id="power"
                      type="number"
                      placeholder="100"
                      value={newDevice.power}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          power: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Daily Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      placeholder="8"
                      value={newDevice.hours}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          hours: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1"
                      value={newDevice.quantity}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={addDevice} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Device
                </Button>

                {devices.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Added Devices</h3>
                    {devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.power}W × {device.hours}h ×{" "}
                            {device.quantity} ={" "}
                            {(
                              (device.power * device.hours * device.quantity) /
                              1000
                            ).toFixed(2)}{" "}
                            kWh/day
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDevice(device.id)}
                          className="ml-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consumption Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Consumption Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {getTotalConsumption().toFixed(2)} kWh
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Daily Consumption
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Devices:</span>
                    <Badge variant="secondary">{devices.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Power:</span>
                    <Badge variant="secondary">{getTotalPower()} W</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>System Efficiency:</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Daily Load Profile
                  </Label>
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Peak usage: Evening hours
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure your solar PV system type and specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>System Type</Label>
                  <Select value={systemType} onValueChange={setSystemType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off-grid">
                        Off-Grid (Standalone)
                      </SelectItem>
                      <SelectItem value="grid-tied">Grid-Tied</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Enter city or coordinates"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Autonomy Days</Label>
                  <Input type="number" placeholder="3" />
                </div>

                <div className="space-y-2">
                  <Label>Depth of Discharge (%)</Label>
                  <Input type="number" placeholder="50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environmental Data</CardTitle>
                <CardDescription>
                  Location-specific solar and weather data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enter your location to get accurate solar irradiation data
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Solar Irradiation</Label>
                    <div className="text-2xl font-bold">5.2 kWh/m²</div>
                    <div className="text-xs text-muted-foreground">
                      Daily average
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Temperature</Label>
                    <div className="text-2xl font-bold">25°C</div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calibration Tab */}
        <TabsContent value="calibration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Calibration</CardTitle>
              <CardDescription>
                Automated component sizing and system optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    Solar Panels
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Required Capacity:</span>
                      <Badge>2.5 kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Panels:</span>
                      <Badge>8 panels</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Panel Type:</span>
                      <Badge variant="secondary">Monocrystalline</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Battery className="h-5 w-5 text-green-500" />
                    Battery Bank
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <Badge>400 Ah</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Voltage:</span>
                      <Badge>24V</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Battery Type:</span>
                      <Badge variant="secondary">Lithium</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Charge Controller
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="secondary">MPPT</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <Badge>60A</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <Badge>98%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-500" />
                    Inverter
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <Badge>3000W</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="secondary">Pure Sine Wave</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <Badge>95%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Analysis and optimization results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Energy Production</Label>
                    <Progress value={85} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      13 kWh/day (85% coverage)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">System Efficiency</Label>
                    <Progress value={92} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      92% overall efficiency
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Cost Optimization</Label>
                    <Progress value={78} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      78% cost-effective solution
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      $12,500
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total System Cost
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      5.2 years
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Payback Period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Actions</CardTitle>
                <CardDescription>
                  Save your project and generate reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save Project
                </Button>

                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF Report
                </Button>

                <Button variant="outline" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Quote
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input placeholder="My Solar Project" />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Additional notes..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};

export default CalculatorTabs;
