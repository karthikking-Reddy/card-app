import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { getCurrentProfile, isAdminUser } from '../../services/profileService';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';

export default function AdminCardPreviewScreen({ navigation, route }) {
  const cardId = route.params?.cardId;
  const [card, setCard] = useState(route.params?.card || null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => { load(); }, [cardId]);
  async function load() {
    try {
      const profile = await getCurrentProfile();
      if (!isAdminUser(profile)) { setDenied(true); return; }
      const { data, error } = await supabase.from('digital_cards').select('*').eq('id', cardId).single();
      if (!error && data) setCard(data);
    } finally { setLoading(false); }
  }

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#F6B91A" /></View>;
  return <SafeAreaView style={s.safe}><Header navigation={navigation}/>{denied?<View style={s.empty}><Ionicons name="lock-closed" size={38} color="#DC2626"/><Text style={s.emptyTitle}>Administrator access required</Text></View>:<ScrollView contentContainerStyle={s.container}>
    <View style={s.hero}>{card?.profile_image_url?<Image source={{uri:card.profile_image_url}} style={s.avatar}/>:<View style={s.avatarFallback}><Text style={s.initial}>{card?.name?.charAt(0)?.toUpperCase()||'Y'}</Text></View>}<Text style={s.name}>{card?.name||'Digital Card'}</Text><Text style={s.designation}>{card?.designation||'No designation'}</Text><Text style={s.company}>{card?.company||'No company'}</Text><ApprovalStatusBadge status={card?.approval_status}/></View>
    <Section title="CONTACT"><Row icon="mail-outline" value={card?.email}/><Row icon="call-outline" value={card?.phone}/><Row icon="logo-whatsapp" value={card?.whatsapp}/><Row icon="globe-outline" value={card?.website}/><Row icon="location-outline" value={card?.location}/></Section>
    <Section title="CARD DETAILS"><Row icon="link-outline" value={`/card/${card?.card_slug||''}`}/><Row icon="briefcase-outline" value={card?.industry}/><Row icon="color-palette-outline" value={card?.theme}/></Section>
    {card?.tagline||card?.bio?<Section title="ABOUT">{card?.tagline?<Text style={s.tagline}>{card.tagline}</Text>:null}{card?.bio?<Text style={s.bio}>{card.bio}</Text>:null}</Section>:null}
  </ScrollView>}</SafeAreaView>;
}
function Header({navigation}){return <View style={s.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={25} color="#FFF"/></TouchableOpacity><View><Text style={s.brand}>YNS CARD</Text><Text style={s.headerTitle}>Authenticated Preview</Text></View><View style={{width:25}}/></View>}
function Section({title,children}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>}
function Row({icon,value}){if(!value)return null;return <View style={s.row}><Ionicons name={icon} size={18} color="#C98B16"/><Text style={s.rowText}>{value}</Text></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5F7FB'},loading:{flex:1,backgroundColor:'#06162D',alignItems:'center',justifyContent:'center'},header:{minHeight:72,paddingHorizontal:18,backgroundColor:'#06162D',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'rgba(246,185,26,.3)'},brand:{color:'#F6B91A',fontSize:9,fontWeight:'900',letterSpacing:1.5,textAlign:'center'},headerTitle:{color:'#FFF',fontSize:17,fontWeight:'900'},container:{padding:16,paddingBottom:50},hero:{backgroundColor:'#06162D',borderRadius:24,borderWidth:1,borderColor:'#F6B91A',padding:22,alignItems:'center'},avatar:{width:96,height:96,borderRadius:32,borderWidth:2,borderColor:'#F6B91A'},avatarFallback:{width:96,height:96,borderRadius:32,backgroundColor:'#FFF4D6',alignItems:'center',justifyContent:'center'},initial:{fontSize:34,fontWeight:'900',color:'#06162D'},name:{color:'#FFF',fontSize:23,fontWeight:'900',marginTop:12},designation:{color:'#D5DDE8',fontSize:12,marginTop:4},company:{color:'#F6B91A',fontSize:10,fontWeight:'800',marginTop:4,marginBottom:12},section:{backgroundColor:'#FFF',borderRadius:18,borderWidth:1,borderColor:'#E6EAF0',padding:16,marginTop:12},sectionTitle:{color:'#06162D',fontSize:10,fontWeight:'900',letterSpacing:1,marginBottom:8},row:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#F2F4F7'},rowText:{flex:1,color:'#344054',fontSize:12},tagline:{color:'#C98B16',fontSize:14,fontWeight:'800'},bio:{color:'#475467',fontSize:12,lineHeight:19,marginTop:8},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:24},emptyTitle:{color:'#06162D',fontSize:17,fontWeight:'900',marginTop:12}});
