package com.assukar.praia.menton.assets.imports
{
	import flash.display.Sprite;

	public class MentonSyncSoundsSwf extends Sprite
	{
		public function MentonSyncSoundsSwf()
		{
			ImportEventsMenton.syncSounds = MentonSyncSoundsSwf;
			ImportEventsMenton.eventDispatcher.dispatchEvent(ImportEventsMenton.SYNC_SOUNDS);
		}

		//soundtrack
		[Embed(source="../../../../../../../assets/sounds/menton_trilha_looping.mp3", mimeType="application/octet-stream")]
		public static var menton_trilha_looping : Class;
		[Embed(source="../../../../../../../assets/sounds/trilha_bonus.mp3", mimeType="application/octet-stream")]
		public static var trilha_bonus : Class;

		//general
		[Embed(source="../../../../../../../assets/sounds/aposta01.mp3", mimeType="application/octet-stream")]
		public static var aposta01 : Class;
		[Embed(source="../../../../../../../assets/sounds/aposta02.mp3", mimeType="application/octet-stream")]
		public static var aposta02 : Class;
		[Embed(source="../../../../../../../assets/sounds/aposta03.mp3", mimeType="application/octet-stream")]
		public static var aposta03 : Class;
		[Embed(source="../../../../../../../assets/sounds/aposta04.mp3", mimeType="application/octet-stream")]
		public static var aposta04 : Class;
		[Embed(source="../../../../../../../assets/sounds/aposta05.mp3", mimeType="application/octet-stream")]
		public static var aposta05 : Class;
		[Embed(source="../../../../../../../assets/sounds/aposta010.mp3", mimeType="application/octet-stream")]
		public static var aposta010 : Class;
        [Embed(source="../../../../../../../assets/sounds/aposta025.mp3", mimeType="application/octet-stream")]
        public static var aposta025 : Class;
        [Embed(source="../../../../../../../assets/sounds/aposta050.mp3", mimeType="application/octet-stream")]
        public static var aposta050 : Class;
        [Embed(source="../../../../../../../assets/sounds/aposta0100.mp3", mimeType="application/octet-stream")]
        public static var aposta0100 : Class;
		[Embed(source="../../../../../../../assets/sounds/trocar_cartela.mp3", mimeType="application/octet-stream")]
		public static var trocar_cartela : Class;
		
		[Embed(source="../../../../../../../assets/sounds/bola_disparo.mp3", mimeType="application/octet-stream")]
		public static var bola_disparo : Class;
		[Embed(source="../../../../../../../assets/sounds/bola_batendo_v2.mp3", mimeType="application/octet-stream")]
		public static var bola_batendo_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/bola_extra_v2.mp3", mimeType="application/octet-stream")]
		public static var bola_extra_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/bola_super_v2.mp3", mimeType="application/octet-stream")]
		public static var bola_super_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/botao_filar_v2.mp3", mimeType="application/octet-stream")]
		public static var botao_filar_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/contagem_valor_v2.mp3", mimeType="application/octet-stream")]
		public static var contagem_valor_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/clique_botao.mp3", mimeType="application/octet-stream")]
		public static var clique_botao : Class;
		
		//slot
		[Embed(source="../../../../../../../assets/sounds/sino.mp3", mimeType="application/octet-stream")]
		public static var sino : Class;
		[Embed(source="../../../../../../../assets/sounds/sino_tocando.mp3", mimeType="application/octet-stream")]
		public static var sino_tocando : Class;
		[Embed(source="../../../../../../../assets/sounds/slot_spin.mp3", mimeType="application/octet-stream")]
		public static var slot_spin : Class;
		[Embed(source="../../../../../../../assets/sounds/slot_stop.mp3", mimeType="application/octet-stream")]
		public static var slot_stop : Class;
		[Embed(source="../../../../../../../assets/sounds/slot_prize_2x.mp3", mimeType="application/octet-stream")]
		public static var slot_prize_2x : Class;
		[Embed(source="../../../../../../../assets/sounds/slot_prize_bonus.mp3", mimeType="application/octet-stream")]
		public static var slot_prize_bonus : Class;
		[Embed(source="../../../../../../../assets/sounds/slot_prize_bomb.mp3", mimeType="application/octet-stream")]
		public static var slot_prize_bomb : Class;
		[Embed(source="../../../../../../../assets/sounds/bomba_caindo.mp3", mimeType="application/octet-stream")]
		public static var bomba_caindo : Class;
		[Embed(source="../../../../../../../assets/sounds/bomba_explodindo.mp3", mimeType="application/octet-stream")]
		public static var bomba_explodindo : Class;
		
		//prizes
		[Embed(source="../../../../../../../assets/sounds/bingo.mp3", mimeType="application/octet-stream")]
		public static var bingo : Class;
		[Embed(source="../../../../../../../assets/sounds/caixa_dupla_v2.mp3", mimeType="application/octet-stream")]
		public static var caixa_dupla_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/duas_colunas.mp3", mimeType="application/octet-stream")]
		public static var duas_colunas : Class;
		[Embed(source="../../../../../../../assets/sounds/linha_dupla_v2.mp3", mimeType="application/octet-stream")]
		public static var linha_dupla_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/linha_v2.mp3", mimeType="application/octet-stream")]
		public static var linha_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/quatro_colunas_v2.mp3", mimeType="application/octet-stream")]
		public static var quatro_colunas_v2 : Class;
		[Embed(source = "../../../../../../../assets/sounds/tres_colunas_v2.mp3", mimeType="application/octet-stream")]		
		public static var tres_colunas_v2 : Class;
		
		//bonus
		[Embed(source="../../../../../../../assets/sounds/esteira_movendo_v2.mp3", mimeType="application/octet-stream")]
		public static var esteira_movendo_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/caixa_quebrando.mp3", mimeType="application/octet-stream")]
		public static var caixa_quebrando : Class;
		[Embed(source="../../../../../../../assets/sounds/limao_vupt.mp3", mimeType="application/octet-stream")]
		public static var limao_vupt : Class;
		[Embed(source="../../../../../../../assets/sounds/limao_grudando_pouco.mp3", mimeType="application/octet-stream")]
		public static var limao_grudando_pouco : Class;
		[Embed(source="../../../../../../../assets/sounds/limao_grudando_medio.mp3", mimeType="application/octet-stream")]
		public static var limao_grudando_medio : Class;
		[Embed(source="../../../../../../../assets/sounds/limao_grudando_muitos.mp3", mimeType="application/octet-stream")]
		public static var limao_grudando_muitos : Class;
		[Embed(source="../../../../../../../assets/sounds/figura_andando.mp3", mimeType="application/octet-stream")]
		public static var figura_andando : Class;
		[Embed(source="../../../../../../../assets/sounds/figura_completa_v3.mp3", mimeType="application/octet-stream")]
		public static var figura_completa_v3 : Class;
		[Embed(source="../../../../../../../assets/sounds/turistas.mp3", mimeType="application/octet-stream")]
		public static var turistas : Class;
		[Embed(source="../../../../../../../assets/sounds/conclusao_lvl_1_v2.mp3", mimeType="application/octet-stream")]
		public static var conclusao_lvl_1_v2 : Class;
		[Embed(source="../../../../../../../assets/sounds/conclusao_lvl_2.mp3", mimeType="application/octet-stream")]
		public static var conclusao_lvl_2 : Class;
		[Embed(source="../../../../../../../assets/sounds/conclusao_lvl_3_v2.mp3", mimeType="application/octet-stream")]
		public static var conclusao_lvl_3_v2 : Class;
		



		// LOCS
		//EN
		[Embed(source = "../../../../../../../assets/sounds/en/male/bingo_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_bingo_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/bingo_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_bingo_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/bingo_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_bingo_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/caixa_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_caixa_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/caixa_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_caixa_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/caixa_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_caixa_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/jackpot_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_jackpot_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/jackpot_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_jackpot_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/jackpot_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_jackpot_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/linha_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_linha_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/linha_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_linha_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/linha_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_linha_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/linha_dupla_4.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_linha_dupla_4_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/quatro_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_quatro_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/quatro_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_quatro_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/quatro_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_quatro_colunas_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/tres_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_tres_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/tres_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_tres_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/en/male/tres_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_EN_tres_colunas_3_CLASS : Class;
		
		
		//ES
		[Embed(source = "../../../../../../../assets/sounds/es/male/bingo_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_bingo_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/bingo_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_bingo_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/bingo_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_bingo_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/bingo_4.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_bingo_4_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/caixa_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_caixa_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/caixa_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_caixa_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/caixa_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_caixa_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/jackpot_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_jackpot_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/jackpot_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_jackpot_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/jackpot_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_jackpot_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/linha_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_linha_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/linha_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_linha_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/linha_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_linha_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/quatro_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_quatro_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/quatro_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_quatro_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/quatro_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_quatro_colunas_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/tres_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_tres_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/es/male/tres_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_ES_tres_colunas_2_CLASS : Class;
		
		
		//FR
		[Embed(source = "../../../../../../../assets/sounds/fr/male/bingo_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_bingo_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/bingo_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_bingo_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/bingo_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_bingo_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/caixa_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_caixa_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/caixa_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_caixa_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/caixa_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_caixa_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/jackpot_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_jackpot_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/jackpot_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_jackpot_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/jackpot_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_jackpot_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/linha_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_linha_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/linha_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_linha_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/linha_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_linha_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/quatro_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_quatro_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/quatro_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_quatro_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/quatro_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_quatro_colunas_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/tres_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_tres_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/tres_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_tres_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/fr/male/tres_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_FR_tres_colunas_3_CLASS : Class;


		//IT
		[Embed(source = "../../../../../../../assets/sounds/it/male/bingo_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_bingo_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/bingo_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_bingo_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/caixa_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_caixa_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/caixa_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_caixa_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/jackpot_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_jackpot_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/jackpot_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_jackpot_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/jackpot_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_jackpot_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/linha_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_linha_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/linha_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_linha_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/linha_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_linha_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/quatro_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_quatro_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/quatro_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_quatro_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/tres_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_tres_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/tres_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_tres_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/it/male/tres_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_IT_tres_colunas_3_CLASS : Class;
	
		
		//PT
		[Embed(source = "../../../../../../../assets/sounds/pt/male/bingo_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_bingo_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/bingo_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_bingo_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/bingo_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_bingo_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/caixa_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_caixa_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/caixa_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_caixa_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/jackpot_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_jackpot_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/jackpot_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_jackpot_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/jackpot_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_jackpot_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/linha_dupla_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_linha_dupla_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/linha_dupla_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_linha_dupla_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/linha_dupla_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_linha_dupla_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/linha_dupla_4.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_linha_dupla_4_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/linha_dupla_5.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_linha_dupla_5_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/quatro_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_quatro_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/quatro_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_quatro_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/quatro_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_quatro_colunas_3_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/quatro_colunas_4.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_quatro_colunas_4_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/tres_colunas_1.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_tres_colunas_1_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/tres_colunas_2.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_tres_colunas_2_CLASS : Class;
		[Embed(source = "../../../../../../../assets/sounds/pt/male/tres_colunas_3.mp3", mimeType="application/octet-stream")]	
		public static var LOC_M_PT_tres_colunas_3_CLASS : Class;
		
	}
}
